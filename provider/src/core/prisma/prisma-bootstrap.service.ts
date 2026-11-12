import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { env } from "../env";
import { PrismaService } from "./prisma.service";
import { importMockMusic, seedMockMusics } from "./mock-catalog";
import { ServerAuthError, ServerClientService } from "../server/server-client.service";

const MOCK_DIR = resolve(process.cwd(), "mock");

// Mock catalog of each dev provider (MOCK_DISCOGRAPHY): provider 1 also serves MOCK_MUSICS
const DISCOGRAPHIES: Record<number, { file: string; audioDir: string }> = {
	1: { file: "discography.v2.json", audioDir: "audio" },
	2: { file: "discography.v3.json", audioDir: "audio2" },
};

interface Discography {
	artists: { uuid: string; name: string; avatarFile?: string }[];
	albums: { uuid: string; name: string; artistUuids: string[]; publishedAt: string; coverUrl: string }[];
	musics: { uuid: string; name: string; artistUuids: string[]; albumUuid: string; duration: number; publishedAt: string; audioFile: string | null }[];
}

// Provider 2 gets its own uuids so the two catalogs stay independent, even for shared artists
function partUuid(part: number, uuid: string) {
	if (part === 1) return uuid;

	const hex = createHash("sha1").update(`provider-${part}:${uuid}`).digest("hex");
	const variant = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

@Injectable()
export class PrismaBootstrapService implements OnModuleInit {
	private readonly logger = new Logger(PrismaBootstrapService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly server: ServerClientService,
	) {}

	async onModuleInit() {
		await this.syncIdentity();

		if (env.NODE_ENV === "dev" && env.MOCK_DISCOGRAPHY !== "2") await this.seedMocks();
		if (env.NODE_ENV === "dev" && env.MOCK_DISCOGRAPHY) await this.seedDiscography(Number(env.MOCK_DISCOGRAPHY));
	}

	private async syncIdentity() {
		let identity;
		try {
			identity = await this.server.getIdentity();
		} catch (error) {
			if (error instanceof ServerAuthError) throw error;

			const stored = await this.prisma.provider.findUnique({ where: { id: 1 } });
			if (!stored) throw error;

			this.logger.warn(`Server unreachable (${(error as Error).message}), keeping the stored identity`);
			return;
		}

		await this.prisma.$transaction(async (tx) => {
			await tx.member.upsert({
				create: { uuid: identity.ownerUuid },
				update: { revokedAt: null, revokedByUuid: null },
				where: { uuid: identity.ownerUuid },
			});

			await tx.provider.upsert({
				create: { id: 1, uuid: identity.uuid, ownerUuid: identity.ownerUuid },
				update: { uuid: identity.uuid, ownerUuid: identity.ownerUuid },
				where: { id: 1 },
			});
		});
	}

	private async seedMocks() {
		const imported = await seedMockMusics(this.prisma, MOCK_DIR, resolve(process.cwd(), env.MEDIA_DIR), (message) => this.logger.warn(message));
		this.logger.log(`Mock data ready (${imported} new musics)`);
	}

	private async seedDiscography(part: number) {
		const mediaRoot = resolve(process.cwd(), env.MEDIA_DIR);
		const { file, audioDir } = DISCOGRAPHIES[part];
		const { artists, albums, musics } = JSON.parse(await readFile(join(MOCK_DIR, file), "utf8")) as Discography;
		const id = (uuid: string) => partUuid(part, uuid);

		for (const artist of artists) {
			const uuid = id(artist.uuid);
			const row = await this.prisma.artist.upsert({ create: { uuid, name: artist.name }, update: {}, where: { uuid } });
			if (row.hasAvatar || !artist.avatarFile) continue;

			const avatarDir = join(mediaRoot, "images/artist");
			await mkdir(avatarDir, { recursive: true });
			// Not every avatarFile listed in the discography was downloaded
			const copied = await copyFile(join(MOCK_DIR, "images/artist", artist.avatarFile), join(avatarDir, `${uuid}.jpg`)).then(() => true, () => false);
			if (copied) await this.prisma.artist.update({ where: { uuid }, data: { hasAvatar: true } });
		}

		for (const album of albums) {
			const uuid = id(album.uuid);
			if (await this.prisma.album.findUnique({ where: { uuid } })) continue;

			await this.prisma.album.create({
				data: {
					uuid,
					name: album.name,
					publishedAt: new Date(album.publishedAt),
					artists: { create: album.artistUuids.map((artistUuid) => ({ artistUuid: id(artistUuid) })) },
				},
			});

			try {
				const response = await fetch(album.coverUrl, { signal: AbortSignal.timeout(10_000) });
				if (!response.ok) throw new Error(`HTTP ${response.status}`);

				const coverDir = join(mediaRoot, "images/album");
				await mkdir(coverDir, { recursive: true });
				await writeFile(join(coverDir, `${uuid}.jpg`), Buffer.from(await response.arrayBuffer()));
				await this.prisma.album.update({ where: { uuid }, data: { hasCover: true } });
			} catch (error) {
				this.logger.warn(`No cover for album "${album.name}": ${(error as Error).message}`);
			}
		}

		for (const music of musics) {
			const data = { uuid: id(music.uuid), name: music.name, albumUuid: id(music.albumUuid), publishedAt: new Date(music.publishedAt) };
			const artists = music.artistUuids.map(id);
			if (await this.prisma.music.findUnique({ where: { uuid: data.uuid } })) continue;

			if (music.audioFile) {
				await importMockMusic(this.prisma, mediaRoot, join(MOCK_DIR, audioDir, music.audioFile), data, artists, (message) => this.logger.warn(message));
			} else {
				await this.prisma.music.create({
					data: { ...data, duration: music.duration, artists: { create: artists.map((artistUuid) => ({ artistUuid })) } },
				});
			}
		}

		this.logger.log(`Discography ${file} ready (${albums.length} albums, ${musics.length} musics)`);
	}
}
