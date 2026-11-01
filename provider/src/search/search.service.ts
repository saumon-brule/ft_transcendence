import { Injectable } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../core/prisma/prisma.service";
import { albumItemInclude, musicItemInclude, toAlbumItem, toArtistItem, toMusicItem } from "../core/catalog/catalog.mappers";

interface SearchQuery {
	query: string;
	limit: number;
}

interface Page {
	limit: number;
	offset: number;
}

export type SearchTable = "Music" | "Artist" | "Album";

interface SearchField {
	column: Prisma.Sql;
	boost: number;
}

const field = (column: string, boost: number): SearchField => ({ column: Prisma.raw(`"${column}"`), boost });

const TABLES: Record<SearchTable, { from: Prisma.Sql; fields: SearchField[] }> = {
	Music: { from: Prisma.raw("\"Music\""), fields: [field("name", 3), field("searchArtists", 2), field("searchAlbum", 1)] },
	Artist: { from: Prisma.raw("\"Artist\""), fields: [field("name", 1)] },
	Album: { from: Prisma.raw("\"Album\""), fields: [field("name", 3), field("searchArtists", 2)] },
};

const MIN_FUZZY_LENGTH = 3;
const MIN_RELATIVE_SCORE = 0.2;

const tokensOf = (value: string) => value.split(/[^\p{L}\p{N}]+/u).filter(Boolean);

@Injectable()
export class SearchService {
	constructor(private readonly prisma: PrismaService) {}

	private async rank(table: SearchTable, rawTerm: string, { limit, offset }: Page) {
		const tokens = tokensOf(rawTerm);
		if (tokens.length === 0) return { ids: [], total: 0 };

		const exact = tokens.join(" ");
		const fuzzy = tokens.filter((token) => token.length >= MIN_FUZZY_LENGTH).join(" ");
		const { from, fields } = TABLES[table];

		const where = Prisma.join(fields.flatMap(({ column, boost }) => {
			const weight = Prisma.raw(String(boost));
			return [
				Prisma.sql`${column} ||| ${exact}::pdb.boost(${weight})`,
				...fuzzy === ""
					? []
					: [Prisma.sql`${column} ||| ${fuzzy}::pdb.fuzzy(1, t, t)::pdb.boost(${weight})`],
			];
		}), " OR ");
		/* something like this fuck
		WHERE "name"          ||| $1::pdb.boost(3)
  		OR    "name"          ||| $2::pdb.fuzzy(1, t, t)::pdb.boost(3)
  		OR    "searchArtists" ||| $3::pdb.boost(2)
  		OR    "searchArtists" ||| $4::pdb.fuzzy(1, t, t)::pdb.boost(2)
  		OR    "searchAlbum"   ||| $5::pdb.boost(1)
  		OR    "searchAlbum"   ||| $6::pdb.fuzzy(1, t, t)::pdb.boost(1)
		*/

		const matches = Prisma.sql`(
			SELECT "id", pdb.score("id") AS "score", max(pdb.score("id")) OVER () AS "best"
			FROM ${from}
			WHERE ${where}
		) AS "matches"`;
		const relevant = Prisma.sql`"score" >= "best" * ${Prisma.raw(String(MIN_RELATIVE_SCORE))}`;

		const [, rows, [{ total }]] = await this.prisma.$transaction([
			this.prisma.$queryRaw`SELECT set_config('paradedb.planner_warnings', 'off', true)`,
			this.prisma.$queryRaw<{ id: number }[]>(Prisma.sql`
				SELECT "id" FROM ${matches}
				WHERE ${relevant}
				ORDER BY "score" DESC, "id" ASC
				LIMIT ${limit}::int OFFSET ${offset}::int
			`),
			this.prisma.$queryRaw<{ total: number }[]>(Prisma.sql`
				SELECT count(*)::int AS "total" FROM ${matches} WHERE ${relevant}
			`),
		]);

		return { ids: rows.map((row) => row.id), total };
	}

	async page<T extends { id: number }>(
		table: SearchTable,
		term: string,
		page: Page,
		load: (ids: number[]) => Promise<T[]>,
	) {
		const { ids, total } = await this.rank(table, term, page);
		if (ids.length === 0) return { rows: [] as T[], total };

		const loaded = new Map((await load(ids)).map((row) => [row.id, row]));
		return { rows: ids.flatMap((id) => loaded.get(id) ?? []), total };
	}

	async search({ query, limit }: SearchQuery) {
		const page = { limit, offset: 0 };

		const [musics, artists, albums] = await Promise.all([
			this.page("Music", query, page, (ids) => this.prisma.music.findMany({ where: { id: { in: ids } }, include: musicItemInclude })),
			this.page("Artist", query, page, (ids) => this.prisma.artist.findMany({ where: { id: { in: ids } } })),
			this.page("Album", query, page, (ids) => this.prisma.album.findMany({ where: { id: { in: ids } }, include: albumItemInclude })),
		]);

		return {
			musics: musics.rows.map(toMusicItem),
			artists: artists.rows.map(toArtistItem),
			albums: albums.rows.map(toAlbumItem),
		};
	}
}
