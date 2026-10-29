import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
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

@Injectable()
export class PrismaBootstrapService implements OnModuleInit {
	private readonly logger = new Logger(PrismaBootstrapService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly server: ServerClientService,
	) {}

	async onModuleInit() {
		await this.syncIdentity();

		if (env.NODE_ENV === "dev") await this.seedMocks();
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
		const mediaRoot = resolve(process.cwd(), env.MEDIA_DIR);

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

			const source = join(MOCK_DIR, file);
			let metadata;
			try {
				metadata = await parseFile(source, { duration: true });
			} catch (error) {
				this.logger.warn(`Skipping mock "${file}": ${(error as Error).message}`);
				continue;
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

		this.logger.log(`Mock data ready (${MOCK_MUSICS.length} musics)`);
	}
}
