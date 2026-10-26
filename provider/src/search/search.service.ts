import { Injectable } from "@nestjs/common";
import { PrismaService } from "../core/prisma/prisma.service";
import { musicItemInclude, toAlbumItem, toArtistItem, toMusicItem } from "../core/catalog/catalog.mappers";

interface SearchQuery {
	query: string;
	limit: number;
}

const CANDIDATE_LIMIT = 200;

const normalize = (value: string) => value
	.normalize("NFD")
	.replace(/\p{Diacritic}/gu, "")
	.toLowerCase();

// Lower is more relevant: exact, prefix, word prefix, then any other match.
const rank = (name: string, term: string) => {
	const text = normalize(name);
	if (text === term) return 0;
	if (text.startsWith(term)) return 1;
	if (text.split(/[^\p{L}\p{N}]+/u).some((word) => word.startsWith(term))) return 2;
	return 3;
};

@Injectable()
export class SearchService {
	constructor(private readonly prisma: PrismaService) {}

	async search({ query, limit }: SearchQuery) {
		const term = normalize(query);
		const where = { name: { contains: query, mode: "insensitive" as const } };
		const take = CANDIDATE_LIMIT;
		const orderBy = [{ name: "asc" as const }, { id: "asc" as const }];

		const [musics, artists, albums] = await Promise.all([
			this.prisma.music.findMany({ where, include: musicItemInclude, orderBy, take }),
			this.prisma.artist.findMany({ where, orderBy, take }),
			this.prisma.album.findMany({ where, orderBy, take }),
		]);

		const best = <T extends { name: string }>(rows: T[]) => rows
			.map((row) => ({ row, score: rank(row.name, term) }))
			.sort((a, b) => a.score - b.score || a.row.name.length - b.row.name.length)
			.slice(0, limit)
			.map(({ row }) => row);

		return {
			musics: best(musics).map(toMusicItem),
			artists: best(artists).map(toArtistItem),
			albums: best(albums).map(toAlbumItem),
		};
	}
}
