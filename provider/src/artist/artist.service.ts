import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../core/prisma/prisma.service";
import { artistWhere, type ArtistFilters } from "../core/catalog/catalog.filters";
import { artistDetailInclude, toArtistDetail, toArtistItem } from "../core/catalog/catalog.mappers";
import { MediaService } from "../media/media.service";
import { SearchService } from "../search/search.service";

interface ListQuery extends ArtistFilters {
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
export class ArtistService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly media: MediaService,
		private readonly search: SearchService,
	) {}

	async list({ limit, offset, search, ...filters }: ListQuery) {
		const where = artistWhere(filters);

		if (search) {
			const only = where && await this.search.idsOf(this.prisma.artist.findMany({ where, select: { id: true } }));
			const { rows, total } = await this.search.page("Artist", search, { limit, offset }, (ids) => this.prisma.artist.findMany({
				where: { id: { in: ids } },
			}), only);
			return { artists: rows.map(toArtistItem), total };
		}

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

	async create(dto: CreateArtist, actorUuid: string) {
		const created = await this.prisma.artist.create({
			data: { name: dto.name, biography: dto.biography ?? null, addedByUuid: actorUuid },
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
		await this.media.discard("artistAvatar", uuid);
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
