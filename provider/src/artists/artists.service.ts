import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "../generated/client/client";
import { PrismaService } from "../core/prisma/prisma.service";
import { artistDetailInclude, toArtistDetail, toArtistItem } from "../core/catalog/catalog.mappers";

interface ListQuery {
	limit: number;
	offset: number;
	search?: string;
}

interface CreateArtist {
	name: string;
	biography?: string | null;
}

type UpdateArtist = Partial<CreateArtist>;

@Injectable()
export class ArtistsService {
	constructor(private readonly prisma: PrismaService) {}

	async list({ limit, offset, search }: ListQuery) {
		const where: Prisma.ArtistWhereInput = search
			? { name: { contains: search, mode: "insensitive" } }
			: {};

		const [rows, total] = await this.prisma.$transaction([
			this.prisma.artist.findMany({
				where,
				orderBy: [{ name: "asc" }, { id: "asc" }],
				take: limit,
				skip: offset,
			}),
			this.prisma.artist.count({ where }),
		]);

		return { artists: rows.map(toArtistItem), total };
	}

	async get(uuid: string) {
		const artist = await this.prisma.artist.findUnique({
			where: { uuid },
			include: artistDetailInclude,
		});
		if (!artist) throw new NotFoundException("Artist not found");

		return toArtistDetail(artist);
	}

	async create(dto: CreateArtist, actorId: number) {
		const created = await this.prisma.artist.create({
			data: { name: dto.name, biography: dto.biography ?? null, addedById: actorId },
			include: artistDetailInclude,
		});
		return toArtistDetail(created);
	}

	async update(uuid: string, dto: UpdateArtist) {
		const data: Prisma.ArtistUpdateInput = {};
		if (dto.name !== undefined) data.name = dto.name;
		if (dto.biography !== undefined) data.biography = dto.biography;

		const updated = await this.prisma.artist.update({
			where: { uuid },
			data,
			include: artistDetailInclude,
		}).catch(this.notFoundOnMissingRecord("Artist not found"));
		return toArtistDetail(updated);
	}

	async remove(uuid: string) {
		await this.prisma.artist.delete({ where: { uuid } })
			.catch(this.notFoundOnMissingRecord("Artist not found"));
	}

	merge(sourceUuid: string, targetUuid: string) {
		if (sourceUuid === targetUuid) {
			throw new ConflictException("Cannot merge an artist into itself");
		}

		return this.prisma.$transaction(async (tx) => {
			const [source, target] = await Promise.all([
				tx.artist.findUnique({ where: { uuid: sourceUuid }, select: { id: true } }),
				tx.artist.findUnique({ where: { uuid: targetUuid }, select: { id: true } }),
			]);
			if (!source) throw new NotFoundException("Artist not found");
			if (!target) throw new NotFoundException("Target artist not found");

			const musicLinks = await tx.musicArtist.findMany({
				where: { artistId: target.id },
				select: { musicId: true },
			});
			await tx.musicArtist.updateMany({
				where: { artistId: source.id, musicId: { notIn: musicLinks.map((link) => link.musicId) } },
				data: { artistId: target.id },
			});

			const albumLinks = await tx.albumArtist.findMany({
				where: { artistId: target.id },
				select: { albumId: true },
			});
			await tx.albumArtist.updateMany({
				where: { artistId: source.id, albumId: { notIn: albumLinks.map((link) => link.albumId) } },
				data: { artistId: target.id },
			});

			await tx.artist.delete({ where: { id: source.id } });

			const merged = await tx.artist.findUniqueOrThrow({
				where: { id: target.id },
				include: artistDetailInclude,
			});
			return toArtistDetail(merged);
		});
	}

	private notFoundOnMissingRecord(message: string) {
		return (error: unknown): never => {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
				throw new NotFoundException(message);
			}
			throw error;
		};
	}
}
