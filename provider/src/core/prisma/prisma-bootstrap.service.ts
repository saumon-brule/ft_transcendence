import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parseFile } from "music-metadata";
import { env } from "../env";
import { PrismaService } from "./prisma.service";
import { ServerAuthError, ServerClientService } from "../server/server-client.service";

const MOCK_DIR = resolve(process.cwd(), "mock");

const MOCK_ARTISTS = [
	{ uuid: "00000000-0000-4000-a000-000000000101", name: "Alpha Wann" },
	{ uuid: "00000000-0000-4000-a000-000000000102", name: "Nujabes" },
	{ uuid: "00000000-0000-4000-a000-000000000103", name: "Chris Gouge" },
];

const MOCK_ALBUMS = [
	{ uuid: "00000000-0000-4000-a000-000000000201", name: "THE ANIME GROOVE MIXTAPE Vol. 2", artistUuids: ["00000000-0000-4000-a000-000000000103"] },
];

const MOCK_MUSICS = [
	{
		uuid: "00000000-0000-4000-a000-000000000001",
		file: "Alpha Wann Nujabes Ça Va Ensemble II Remix.mp3",
		name: "ÇA VA ENSEMBLE II (remix)",
		artistUuids: ["00000000-0000-4000-a000-000000000101", "00000000-0000-4000-a000-000000000102"],
		albumUuid: null,
	},
	{
		uuid: "00000000-0000-4000-a000-000000000002",
		file: "TAIRE 1.mp3",
		name: "TAIRE #1",
		artistUuids: [],
		albumUuid: null,
	},
	{
		uuid: "00000000-0000-4000-a000-000000000003",
		file: "the-newer-sweet-groove.mp3",
		name: "the newer sweet groove",
		artistUuids: ["00000000-0000-4000-a000-000000000103"],
		albumUuid: "00000000-0000-4000-a000-000000000201",
	},
];

const COVER_EXTENSIONS: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
};

// mock/discography.v2.json: each album lists the mock providers (MOCK_DISCOGRAPHY) that serve it
interface Discography {
	artists: { uuid: string; name: string; avatarFile?: string }[];
	albums: { uuid: string; name: string; artistUuids: string[]; publishedAt: string; coverUrl: string; providers: number[] }[];
	musics: { uuid: string; name: string; artistUuids: string[]; albumUuid: string; duration: number; publishedAt: string; audioFile: string | null }[];
}

interface MockMusic {
	uuid: string;
	name: string;
	albumUuid: string | null;
	publishedAt?: Date;
}

// Provider 2 gets its own uuids so the two catalogs stay independent, even for the shared albums
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
		for (const artist of MOCK_ARTISTS) {
			await this.prisma.artist.upsert({ create: artist, update: {}, where: { uuid: artist.uuid } });
		}

		for (const { artistUuids, ...album } of MOCK_ALBUMS) {
			await this.prisma.album.upsert({
				create: { ...album, artists: { create: artistUuids.map((artistUuid) => ({ artistUuid })) } },
				update: {},
				where: { uuid: album.uuid },
			});
		}

		for (const { file, artistUuids, ...music } of MOCK_MUSICS) {
			if (await this.prisma.music.findUnique({ where: { uuid: music.uuid } })) continue;

			await this.importMockMusic(join(MOCK_DIR, file), music, artistUuids);
		}

		this.logger.log(`Mock data ready (${MOCK_MUSICS.length} musics)`);
	}

	private async seedDiscography(part: number) {
		const mediaRoot = resolve(process.cwd(), env.MEDIA_DIR);
		const discography = JSON.parse(await readFile(join(MOCK_DIR, "discography.v2.json"), "utf8")) as Discography;
		const id = (uuid: string) => partUuid(part, uuid);

		const albums = discography.albums.filter((album) => album.providers.includes(part));
		const albumUuids = new Set(albums.map((album) => album.uuid));
		const musics = discography.musics.filter((music) => albumUuids.has(music.albumUuid));
		const artistUuids = new Set([...albums, ...musics].flatMap((entry) => entry.artistUuids));

		for (const artist of discography.artists.filter((artist) => artistUuids.has(artist.uuid))) {
			const uuid = id(artist.uuid);
			const row = await this.prisma.artist.upsert({ create: { uuid, name: artist.name }, update: {}, where: { uuid } });
			if (row.hasAvatar || !artist.avatarFile) continue;

			const avatarDir = join(mediaRoot, "images/artist");
			await mkdir(avatarDir, { recursive: true });
			await copyFile(join(MOCK_DIR, "images/artist", artist.avatarFile), join(avatarDir, `${uuid}.jpg`));
			await this.prisma.artist.update({ where: { uuid }, data: { hasAvatar: true } });
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
				await this.importMockMusic(join(MOCK_DIR, "audio", music.audioFile), data, artists);
			} else {
				await this.prisma.music.create({
					data: { ...data, duration: music.duration, artists: { create: artists.map((artistUuid) => ({ artistUuid })) } },
				});
			}
		}

		this.logger.log(`Discography part ${part} ready (${albums.length} albums, ${musics.length} musics)`);
	}

	private async importMockMusic(source: string, music: MockMusic, artistUuids: string[]) {
		const mediaRoot = resolve(process.cwd(), env.MEDIA_DIR);

		let metadata;
		try {
			metadata = await parseFile(source, { duration: true });
		} catch (error) {
			this.logger.warn(`Skipping mock "${source}": ${(error as Error).message}`);
			return;
		}

		const audioDir = join(mediaRoot, "audio");
		await mkdir(audioDir, { recursive: true });
		await copyFile(source, join(audioDir, `${music.uuid}.mp3`));

		const picture = metadata.common.picture?.[0];
		const coverExtension = picture && COVER_EXTENSIONS[picture.format];
		if (coverExtension) {
			const coverDir = join(mediaRoot, "images/music");
			await mkdir(coverDir, { recursive: true });
			await writeFile(join(coverDir, `${music.uuid}.${coverExtension}`), picture.data);
		}

		await this.prisma.music.create({
			data: {
				...music,
				duration: Math.round(metadata.format.duration ?? 0),
				hasAudio: true,
				hasCover: Boolean(coverExtension),
				artists: { create: artistUuids.map((artistUuid) => ({ artistUuid })) },
			},
		});
	}
}
