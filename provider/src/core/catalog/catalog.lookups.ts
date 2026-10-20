import { NotFoundException } from "@nestjs/common";
import { Prisma } from "../../generated/prisma/client";

export async function findArtistIds(db: Prisma.TransactionClient, uuids: string[]) {
	const unique = [...new Set(uuids)];
	const artists = await db.artist.findMany({
		where: { uuid: { in: unique } },
		select: { id: true },
	});

	if (artists.length !== unique.length) {
		throw new NotFoundException("Artist not found");
	}
	return artists.map((artist) => artist.id);
}

export async function findAlbumId(db: Prisma.TransactionClient, uuid: string) {
	const album = await db.album.findUnique({ where: { uuid }, select: { id: true } });

	if (!album) {
		throw new NotFoundException("Album not found");
	}
	return album.id;
}
