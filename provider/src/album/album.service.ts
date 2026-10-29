import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../core/prisma/prisma.service";
import { findArtistUuids } from "../core/catalog/catalog.lookups";
import { albumDetailInclude, albumItemInclude, toAlbumDetail, toAlbumItem } from "../core/catalog/catalog.mappers";
import { MediaService } from "../media/media.service";
import { SearchService } from "../search/search.service";

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
export class AlbumService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly media: MediaService,
		private readonly search: SearchService,
	) {}

	async list({ limit, offset, search }: ListQuery) {
		if (search) {
			const { rows, total } = await this.search.page("Album", search, { limit, offset }, (ids) => this.prisma.album.findMany({
				include: albumItemInclude,
				where: { id: { in: ids } },
			}));
			return { albums: rows.map(toAlbumItem), total };
		}

		const [rows, total] = await this.prisma.$transaction([
			this.prisma.album.findMany({
				include: albumItemInclude,
				orderBy: [{ name: "asc" }, { id: "asc" }],
				take: limit,
				skip: offset,
			}),
			this.prisma.album.count(),
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

	create(dto: CreateAlbum, actorUuid: string) {
		return this.prisma.$transaction(async (tx) => {
			const artistUuids = await findArtistUuids(tx, dto.artistUuids);

			const created = await tx.album.create({
				data: {
					name: dto.name,
					publishedAt: dto.publishedAt ?? null,
					addedByUuid: actorUuid,
					artists: { create: artistUuids.map((artistUuid) => ({ artistUuid })) },
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
				const artistUuids = await findArtistUuids(tx, dto.artistUuids);
				await tx.albumArtist.deleteMany({ where: { albumUuid: uuid } });
				await tx.albumArtist.createMany({
					data: artistUuids.map((artistUuid) => ({ albumUuid: uuid, artistUuid })),
				});
			}

			const updated = await tx.album.update({
				where: { uuid },
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
		await this.media.discard("albumCover", uuid);
	}
}
