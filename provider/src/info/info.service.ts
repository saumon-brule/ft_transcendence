import { Injectable } from "@nestjs/common";
import { PrismaService } from "../core/prisma/prisma.service";
import { albumItemInclude, musicItemInclude, toAlbumItem, toArtistItem, toMusicItem } from "../core/catalog/catalog.mappers";

const byName = [{ name: "asc" as const }, { id: "asc" as const }];

@Injectable()
export class InfoService {
	constructor(private readonly prisma: PrismaService) {}

	async get() {
		const provider = await this.prisma.provider.findUniqueOrThrow({ where: { id: 1 } });
		return { uuid: provider.uuid, visibility: provider.visibility };
	}

	async all() {
		const [info, musics, albums, artists] = await Promise.all([
			this.get(),
			this.prisma.music.findMany({ include: musicItemInclude, orderBy: byName }),
			this.prisma.album.findMany({ include: albumItemInclude, orderBy: byName }),
			this.prisma.artist.findMany({ orderBy: byName }),
		]);

		return {
			...info,
			music: { musics: musics.map(toMusicItem), total: musics.length },
			album: { albums: albums.map(toAlbumItem), total: albums.length },
			artist: { artists: artists.map(toArtistItem), total: artists.length },
		};
	}
}
