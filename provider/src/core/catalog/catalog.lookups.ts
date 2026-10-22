import { NotFoundException } from "@nestjs/common";
import { Prisma } from "../../generated/prisma/client";

export async function findArtistUuids(db: Prisma.TransactionClient, uuids: string[]) {
	const unique = [...new Set(uuids)];
	const found = await db.artist.count({ where: { uuid: { in: unique } } });

	if (found !== unique.length) {
		throw new NotFoundException("Artist not found");
	}
	return unique;
}

export async function findAlbumUuid(db: Prisma.TransactionClient, uuid: string) {
	const album = await db.album.findUnique({ where: { uuid }, select: { id: true } });

	if (!album) {
		throw new NotFoundException("Album not found");
	}
	return uuid;
}
