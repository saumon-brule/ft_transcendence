import { Injectable, NotFoundException } from "@nestjs/common";
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

	private notFoundOnMissingRecord(message: string) {
		return (error: unknown): never => {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
				throw new NotFoundException(message);
			}
			throw error;
		};
	}
}
