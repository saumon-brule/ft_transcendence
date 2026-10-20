import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../core/prisma/prisma.service";
import { findAlbumId, findArtistIds } from "../core/catalog/catalog.lookups";
import { musicDetailInclude, musicItemInclude, toMusicDetail, toMusicItem } from "../core/catalog/catalog.mappers";
import { MusicAudioService, NO_FILE } from "./music-audio.service";

interface ListQuery {
	limit: number;
	offset: number;
	search?: string;
}

interface CreateMusic {
	name: string;
	duration: number;
	publishedAt?: Date | null;
	albumUuid?: string | null;
	artistUuids: string[];
}

type UpdateMusic = Partial<CreateMusic>;

@Injectable()
export class MusicService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly audio: MusicAudioService,
	) {}

	async list({ limit, offset, search }: ListQuery) {
		const where: Prisma.MusicWhereInput = search
			? { name: { contains: search, mode: "insensitive" } }
			: {};

		const [rows, total] = await this.prisma.$transaction([
			this.prisma.music.findMany({
				where,
				include: musicItemInclude,
				orderBy: [{ name: "asc" }, { id: "asc" }],
				take: limit,
				skip: offset,
			}),
			this.prisma.music.count({ where }),
		]);

		return { musics: rows.map(toMusicItem), total };
	}

	async get(uuid: string) {
		const music = await this.prisma.music.findUnique({
			where: { uuid },
			include: musicDetailInclude,
		});
		if (!music) throw new NotFoundException("Music not found");

		return toMusicDetail(music);
	}

	create(dto: CreateMusic, actorId: number) {
		return this.prisma.$transaction(async (tx) => {
			const artistIds = await findArtistIds(tx, dto.artistUuids);
			const albumId = dto.albumUuid
				? await findAlbumId(tx, dto.albumUuid)
				: null;

			const created = await tx.music.create({
				data: {
					name: dto.name,
					duration: dto.duration,
					publishedAt: dto.publishedAt ?? null,
					path: NO_FILE,
					albumId,
					addedById: actorId,
					artists: { create: artistIds.map((artistId) => ({ artistId })) },
				},
				include: musicDetailInclude,
			});
			return toMusicDetail(created);
		});
	}

	update(uuid: string, dto: UpdateMusic) {
		return this.prisma.$transaction(async (tx) => {
			const music = await tx.music.findUnique({ where: { uuid }, select: { id: true } });
			if (!music) throw new NotFoundException("Music not found");

			const data: Prisma.MusicUncheckedUpdateInput = {};
			if (dto.name !== undefined) data.name = dto.name;
			if (dto.duration !== undefined) data.duration = dto.duration;
			if (dto.publishedAt !== undefined) data.publishedAt = dto.publishedAt;
			if (dto.albumUuid !== undefined) {
				data.albumId = dto.albumUuid === null
					? null
					: await findAlbumId(tx, dto.albumUuid);
			}

			if (dto.artistUuids !== undefined) {
				const artistIds = await findArtistIds(tx, dto.artistUuids);
				await tx.musicArtist.deleteMany({ where: { musicId: music.id } });
				await tx.musicArtist.createMany({
					data: artistIds.map((artistId) => ({ musicId: music.id, artistId })),
				});
			}

			const updated = await tx.music.update({
				where: { id: music.id },
				data,
				include: musicDetailInclude,
			});
			return toMusicDetail(updated);
		});
	}

	async remove(uuid: string) {
		const music = await this.prisma.music.findUnique({
			where: { uuid },
			select: { id: true, path: true },
		});
		if (!music) throw new NotFoundException("Music not found");

		await this.prisma.music.delete({ where: { id: music.id } });
		await this.audio.deleteFile(music.path);
	}
}
