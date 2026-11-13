import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseFile } from "music-metadata";
import type { PrismaClient } from "../../generated/prisma/client";

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

export interface MockMusic {
	uuid: string;
	name: string;
	albumUuid: string | null;
	publishedAt?: Date;
}

export async function importMockMusic(
	prisma: PrismaClient,
	mediaRoot: string,
	source: string,
	music: MockMusic,
	artistUuids: string[],
	warn: (message: string) => void,
) {
	let metadata;
	try {
		metadata = await parseFile(source, { duration: true });
	} catch (error) {
		warn(`Skipping mock "${source}": ${(error as Error).message}`);
		return false;
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

	await prisma.music.create({
		data: {
			...music,
			duration: Math.round(metadata.format.duration ?? 0),
			hasAudio: true,
			hasCover: Boolean(coverExtension),
			artists: { create: artistUuids.map((artistUuid) => ({ artistUuid })) },
		},
	});
	return true;
}

export async function seedMockMusics(prisma: PrismaClient, mockDir: string, mediaRoot: string, warn: (message: string) => void) {
	for (const artist of MOCK_ARTISTS) {
		await prisma.artist.upsert({ create: artist, update: {}, where: { uuid: artist.uuid } });
	}

	for (const { artistUuids, ...album } of MOCK_ALBUMS) {
		await prisma.album.upsert({
			create: { ...album, artists: { create: artistUuids.map((artistUuid) => ({ artistUuid })) } },
			update: {},
			where: { uuid: album.uuid },
		});
	}

	let imported = 0;
	for (const { file, artistUuids, ...music } of MOCK_MUSICS) {
		if (await prisma.music.findUnique({ where: { uuid: music.uuid } })) continue;

		if (await importMockMusic(prisma, mediaRoot, join(mockDir, file), music, artistUuids, warn)) imported++;
	}
	return imported;
}
