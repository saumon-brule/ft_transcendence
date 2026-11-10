import { Injectable } from "@nestjs/common";
import { DEFAULT_PAGINATION_LIMIT } from "@flex/shared";
import { PrismaService } from "../core/prisma/prisma.service";
import { albumItemInclude, musicItemInclude, toAlbumItem, toArtistItem, toMusicItem } from "../core/catalog/catalog.mappers";

const DB_TIMEOUT_MS = 3000;
const byName = [{ name: "asc" as const }, { id: "asc" as const }];
const firstPage = { take: DEFAULT_PAGINATION_LIMIT, skip: 0 };

@Injectable()
export class InfoService {
	constructor(private readonly prisma: PrismaService) {}

	async isDatabaseUp(): Promise<boolean> {
		try {
			await Promise.race([
				this.prisma.$queryRaw`SELECT 1`,
				new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), DB_TIMEOUT_MS).unref()),
			]);
			return true;
		} catch {
			return false;
		}
	}

	async get() {
		const provider = await this.prisma.provider.findUniqueOrThrow({ where: { id: 1 } });
		return { uuid: provider.uuid, visibility: provider.visibility };
	}

	async all() {
		const [info, [musics, musicTotal, albums, albumTotal, artists, artistTotal]] = await Promise.all([
			this.get(),
			this.prisma.$transaction([
				this.prisma.music.findMany({ include: musicItemInclude, orderBy: byName, ...firstPage }),
				this.prisma.music.count(),
				this.prisma.album.findMany({ include: albumItemInclude, orderBy: byName, ...firstPage }),
				this.prisma.album.count(),
				this.prisma.artist.findMany({ orderBy: byName, ...firstPage }),
				this.prisma.artist.count(),
			]),
		]);

		return {
			...info,
			music: { musics: musics.map(toMusicItem), total: musicTotal },
			album: { albums: albums.map(toAlbumItem), total: albumTotal },
			artist: { artists: artists.map(toArtistItem), total: artistTotal },
		};
	}
}
