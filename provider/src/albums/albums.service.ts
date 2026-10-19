import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../core/prisma/prisma.service";
import { findArtistIds } from "../core/catalog/catalog.lookups";
import { albumDetailInclude, toAlbumDetail, toAlbumItem } from "../core/catalog/catalog.mappers";

interface ListQuery {
	limit: number;
	offset: number;
	search?: string;
}

interface CreateAlbum {
	name: string;
	publishedAt?: Date | null;
	artistUuids: string[];
}

type UpdateAlbum = Partial<CreateAlbum>;

@Injectable()
export class AlbumsService {
	constructor(private readonly prisma: PrismaService) {}

	async list({ limit, offset, search }: ListQuery) {
		const where: Prisma.AlbumWhereInput = search
			? { name: { contains: search, mode: "insensitive" } }
			: {};

		const [rows, total] = await this.prisma.$transaction([
			this.prisma.album.findMany({
				where,
				orderBy: [{ name: "asc" }, { id: "asc" }],
				take: limit,
				skip: offset,
			}),
			this.prisma.album.count({ where }),
		]);

		return { albums: rows.map(toAlbumItem), total };
	}

	async get(uuid: string) {
		const album = await this.prisma.album.findUnique({
			where: { uuid },
			include: albumDetailInclude,
		});
		if (!album) throw new NotFoundException("Album not found");

		return toAlbumDetail(album);
	}

	create(dto: CreateAlbum, actorId: number) {
		return this.prisma.$transaction(async (tx) => {
			const artistIds = await findArtistIds(tx, dto.artistUuids);

			const created = await tx.album.create({
				data: {
					name: dto.name,
					publishedAt: dto.publishedAt ?? null,
					addedById: actorId,
					artists: { create: artistIds.map((artistId) => ({ artistId })) },
				},
				include: albumDetailInclude,
			});
			return toAlbumDetail(created);
		});
	}

	update(uuid: string, dto: UpdateAlbum) {
		return this.prisma.$transaction(async (tx) => {
			const album = await tx.album.findUnique({ where: { uuid }, select: { id: true } });
			if (!album) throw new NotFoundException("Album not found");

			const data: Prisma.AlbumUpdateInput = {};
			if (dto.name !== undefined) data.name = dto.name;
			if (dto.publishedAt !== undefined) data.publishedAt = dto.publishedAt;

			if (dto.artistUuids !== undefined) {
				const artistIds = await findArtistIds(tx, dto.artistUuids);
				await tx.albumArtist.deleteMany({ where: { albumId: album.id } });
				await tx.albumArtist.createMany({
					data: artistIds.map((artistId) => ({ albumId: album.id, artistId })),
				});
			}

			const updated = await tx.album.update({
				where: { id: album.id },
				data,
				include: albumDetailInclude,
			});
			return toAlbumDetail(updated);
		});
	}

	async remove(uuid: string) {
		const album = await this.prisma.album.findUnique({ where: { uuid }, select: { id: true } });
		if (!album) throw new NotFoundException("Album not found");

		await this.prisma.album.delete({ where: { id: album.id } });
	}
}
