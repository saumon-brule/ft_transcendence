import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../core/prisma/prisma.service";
import { findAlbumUuid, findArtistUuids } from "../core/catalog/catalog.lookups";
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

	create(dto: CreateMusic, actorUuid: string) {
		return this.prisma.$transaction(async (tx) => {
			const artistUuids = await findArtistUuids(tx, dto.artistUuids);
			const albumUuid = dto.albumUuid
				? await findAlbumUuid(tx, dto.albumUuid)
				: null;

			const created = await tx.music.create({
				data: {
					name: dto.name,
					duration: dto.duration,
					publishedAt: dto.publishedAt ?? null,
					path: NO_FILE,
					albumUuid,
					addedByUuid: actorUuid,
					artists: { create: artistUuids.map((artistUuid) => ({ artistUuid })) },
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
				data.albumUuid = dto.albumUuid === null
					? null
					: await findAlbumUuid(tx, dto.albumUuid);
			}

			if (dto.artistUuids !== undefined) {
				const artistUuids = await findArtistUuids(tx, dto.artistUuids);
				await tx.musicArtist.deleteMany({ where: { musicUuid: uuid } });
				await tx.musicArtist.createMany({
					data: artistUuids.map((artistUuid) => ({ musicUuid: uuid, artistUuid })),
				});
			}

			const updated = await tx.music.update({
				where: { uuid },
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
