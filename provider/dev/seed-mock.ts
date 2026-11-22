/*
 * Mock catalog of a dev provider. Run by "pnpm run dev:init" and by "prisma migrate reset", never by the
 * provider itself, and not part of the production image.
 *
 *   pnpm --filter @flex/provider run seed:mock                      -> the three mp3 of ./mock (provider 1 and default)
 *   MOCK_DISCOGRAPHY=1 pnpm --filter @flex/provider run seed:mock  -> also discography.v2.json (provider 1)
 *   MOCK_DISCOGRAPHY=2 pnpm --filter @flex/provider run seed:mock  -> discography.v3.json only (provider 2)
 *
 * MOCK_DIR and MEDIA_DIR can be set, they default to ./mock and ./media.
 */
import "dotenv/config";
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { importMockMusic, seedMockMusics } from "./mock-catalog";

const MOCK_DIR = resolve(process.cwd(), process.env["MOCK_DIR"] ?? "mock");
const MEDIA_DIR = resolve(process.cwd(), process.env["MEDIA_DIR"] ?? "media");
const WHICH = process.env["MOCK_DISCOGRAPHY"];

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

async function seedDiscography(prisma: PrismaClient, part: number) {
	const mediaRoot = MEDIA_DIR;
	const { file, audioDir } = DISCOGRAPHIES[part];
	const { artists, albums, musics } = JSON.parse(await readFile(join(MOCK_DIR, file), "utf8")) as Discography;
	const id = (uuid: string) => partUuid(part, uuid);

	for (const artist of artists) {
		const uuid = id(artist.uuid);
		const row = await prisma.artist.upsert({ create: { uuid, name: artist.name }, update: {}, where: { uuid } });
		if (row.hasAvatar || !artist.avatarFile) continue;

		const avatarDir = join(mediaRoot, "images/artist");
		await mkdir(avatarDir, { recursive: true });
		// Not every avatarFile listed in the discography was downloaded
		const copied = await copyFile(join(MOCK_DIR, "images/artist", artist.avatarFile), join(avatarDir, `${uuid}.jpg`)).then(() => true, () => false);
		if (copied) await prisma.artist.update({ where: { uuid }, data: { hasAvatar: true } });
	}

	for (const album of albums) {
		const uuid = id(album.uuid);
		if (await prisma.album.findUnique({ where: { uuid } })) continue;

		await prisma.album.create({
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
			await prisma.album.update({ where: { uuid }, data: { hasCover: true } });
		} catch (error) {
			console.warn(`No cover for album "${album.name}": ${(error as Error).message}`);
		}
	}

	for (const music of musics) {
		const data = { uuid: id(music.uuid), name: music.name, albumUuid: id(music.albumUuid), publishedAt: new Date(music.publishedAt) };
		const artists = music.artistUuids.map(id);
		if (await prisma.music.findUnique({ where: { uuid: data.uuid } })) continue;

		if (music.audioFile) {
			await importMockMusic(prisma, mediaRoot, join(MOCK_DIR, audioDir, music.audioFile), data, artists, (message) => console.warn(message));
		} else {
			await prisma.music.create({
				data: { ...data, duration: music.duration, artists: { create: artists.map((artistUuid) => ({ artistUuid })) } },
			});
		}
	}

	console.log(`Discography ${file} ready (${albums.length} albums, ${musics.length} musics)`);
}

async function main() {
	const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env["DATABASE_URL"] }) });
	try {
		if (WHICH !== "2") {
			const imported = await seedMockMusics(prisma, MOCK_DIR, MEDIA_DIR, (message) => console.warn(message));
			console.log(`Mock data ready (${imported} new musics)`);
		}
		if (WHICH === "1" || WHICH === "2") await seedDiscography(prisma, Number(WHICH));
	} finally {
		await prisma.$disconnect();
	}
}

main().catch((error: unknown) => {
	console.error(error);
	process.exit(1);
});
