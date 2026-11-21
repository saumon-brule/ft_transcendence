import { Injectable } from "@nestjs/common";
import type { SearchSortField, SortOrder } from "@flex/shared";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../core/prisma/prisma.service";
import { FILTER_CONDITIONS, type CatalogFilters } from "../core/catalog/catalog.filters";
import { albumItemInclude, musicItemInclude, toAlbumItem, toArtistItem, toMusicItem } from "../core/catalog/catalog.mappers";

interface SearchQuery {
	query?: string;
	limit: number;
	music?: string;
	artist?: string;
	album?: string;
	artistUuid?: string;
	albumUuid?: string;
	dateBefore?: Date;
	dateAfter?: Date;
	sort?: SearchSortField;
	order?: SortOrder;
}

interface Page {
	limit: number;
	offset: number;
}

export interface PageQuery<T extends SearchTable> extends Page {
	search?: string;
	filters?: CatalogFilters[T];
	sort?: SearchSortField;
	order?: SortOrder;
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

// Text columns are compared case-insensitively and an empty value (no artist, no album) goes last. A field a table does not have cannot be sorted on and is ignored.
const SORT_EXPRESSIONS: Record<SearchTable, Partial<Record<SearchSortField, string>>> = {
	Music: { name: "lower(\"name\")", artist: "nullif(lower(\"searchArtists\"), '')", album: "nullif(lower(\"searchAlbum\"), '')", published: "\"publishedAt\"", duration: "\"duration\"" },
	Album: { name: "lower(\"name\")", artist: "nullif(lower(\"searchArtists\"), '')", published: "\"publishedAt\"" },
	Artist: { name: "lower(\"name\")" },
};

const sortOf = (table: SearchTable, sort?: SearchSortField, order: SortOrder = "asc") => {
	const expression = sort && SORT_EXPRESSIONS[table][sort];
	return expression
		? { expression: Prisma.raw(expression),
			direction: Prisma.raw(order === "desc"
				? "DESC"
				: "ASC") }
		: undefined;
};

type Sort = NonNullable<ReturnType<typeof sortOf>>;

const FUZZY_DISTANCES = [
	{ minLength: 3, distance: 1 },
	{ minLength: 6, distance: 2 },
	{ minLength: 8, distance: 3 },
];
const MIN_RELATIVE_SCORE = 0.2;

const tokensOf = (value: string) => value.split(/[^\p{L}\p{N}]+/u).filter(Boolean);

@Injectable()
export class SearchService {
	constructor(private readonly prisma: PrismaService) {}

	private async ids<T extends SearchTable>(table: T, { search, filters, limit, offset, sort, order }: PageQuery<T>) {
		const conditions = (FILTER_CONDITIONS[table])(filters ?? {});
		const sorting = sortOf(table, sort, order);
		return search === undefined
			? this.list(table, conditions, { limit, offset }, sorting)
			: this.rank(table, search, conditions, { limit, offset }, sorting);
	}

	private async list(table: SearchTable, conditions: Prisma.Sql[], { limit, offset }: Page, sort?: Sort) {
		const { from } = TABLES[table];
		const ordering = sort
			? Prisma.sql`ORDER BY ${sort.expression} ${sort.direction} NULLS LAST, "id" ASC`
			: Prisma.empty;
		const where = conditions.length > 0
			? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`
			: Prisma.empty;

		const [rows, [{ total }]] = await this.prisma.$transaction([
			this.prisma.$queryRaw<{ id: number }[]>(Prisma.sql`
				SELECT "id" FROM ${from} ${where}
				${ordering}
				LIMIT ${limit}::int OFFSET ${offset}::int
			`),
			this.prisma.$queryRaw<{ total: number }[]>(Prisma.sql`
				SELECT count(*)::int AS "total" FROM ${from} ${where}
			`),
		]);

		return { ids: rows.map((row) => row.id), total };
	}

	private async rank(table: SearchTable, rawTerm: string, conditions: Prisma.Sql[], { limit, offset }: Page, sort?: Sort) {
		const tokens = tokensOf(rawTerm);
		if (tokens.length === 0) return { ids: [], total: 0 };

		const exact = tokens.join(" ");
		const fuzzy = FUZZY_DISTANCES.map(({ minLength, distance }, index, all) => ({
			distance: Prisma.raw(String(distance)),
			term: tokens
				.filter((token) => token.length >= minLength && token.length < (all[index + 1]?.minLength ?? Infinity))
				.join(" "),
		})).filter(({ term }) => term !== "");
		const { from, fields } = TABLES[table];

		const where = Prisma.join(fields.flatMap(({ column, boost }) => {
			const weight = Prisma.raw(String(boost));
			return [
				Prisma.sql`${column} ||| ${exact}::pdb.boost(${weight})`,
				...fuzzy.map(({ distance, term }) => Prisma.sql`${column} ||| ${term}::pdb.fuzzy(${distance}, t, t)::pdb.boost(${weight})`),
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

		const sortKey = sort
			? Prisma.sql`, ${sort.expression} AS "sortKey"`
			: Prisma.empty;
		const sortOrdering = sort
			? Prisma.sql`"sortKey" ${sort.direction} NULLS LAST, `
			: Prisma.empty;
		const restriction = conditions.length > 0
			? Prisma.sql` AND ${Prisma.join(conditions, " AND ")}`
			: Prisma.empty;
		const matches = Prisma.sql`(
			SELECT "id", pdb.score("id") AS "score", max(pdb.score("id")) OVER () AS "best"${sortKey}
			FROM ${from}
			WHERE (${where})${restriction}
		) AS "matches"`;
		const relevant = Prisma.sql`"score" >= "best" * ${Prisma.raw(String(MIN_RELATIVE_SCORE))}`;

		const [, rows, [{ total }]] = await this.prisma.$transaction([
			this.prisma.$queryRaw`SELECT set_config('paradedb.planner_warnings', 'off', true)`,
			this.prisma.$queryRaw<{ id: number }[]>(Prisma.sql`
				SELECT "id" FROM ${matches}
				WHERE ${relevant}
				ORDER BY ${sortOrdering}"score" DESC, "id" ASC
				LIMIT ${limit}::int OFFSET ${offset}::int
			`),
			this.prisma.$queryRaw<{ total: number }[]>(Prisma.sql`
				SELECT count(*)::int AS "total" FROM ${matches} WHERE ${relevant}
			`),
		]);

		return { ids: rows.map((row) => row.id), total };
	}

	async page<K extends SearchTable, T extends { id: number }>(
		table: K,
		query: PageQuery<K>,
		load: (ids: number[]) => Promise<T[]>,
	) {
		const { ids, total } = await this.ids(table, query);
		if (ids.length === 0) return { rows: [] as T[], total };

		const loaded = new Map((await load(ids)).map((row) => [row.id, row]));
		return { rows: ids.flatMap((id) => loaded.get(id) ?? []), total };
	}

	async search({ query, limit, music, artist, album, artistUuid, albumUuid, dateBefore, dateAfter, sort, order }: SearchQuery) {
		const base = { search: query, limit, offset: 0, sort, order };
		const hasDate = dateBefore !== undefined || dateAfter !== undefined;
		const none = { rows: [], total: 0 };

		const [musics, artists, albums] = await Promise.all([
			this.page(
				"Music",
				{ ...base, filters: { name: music, artist, album, artistUuid, albumUuid, dateBefore, dateAfter } },
				(ids) => this.prisma.music.findMany({ where: { id: { in: ids } }, include: musicItemInclude }),
			),
			// An artist has no music, album nor date: those filters can only exclude it.
			music !== undefined || album !== undefined || albumUuid !== undefined || hasDate
				? none
				: this.page(
					"Artist",
					{ ...base, filters: { uuid: artistUuid, name: artist } },
					(ids) => this.prisma.artist.findMany({ where: { id: { in: ids } } }),
				),
			// An album is not a music: a music name can only exclude it.
			music !== undefined
				? none
				: this.page(
					"Album",
					{ ...base, filters: { uuid: albumUuid, name: album, artist, artistUuid, dateBefore, dateAfter } },
					(ids) => this.prisma.album.findMany({ where: { id: { in: ids } }, include: albumItemInclude }),
				),
		]);

		return {
			musics: musics.rows.map(toMusicItem),
			artists: artists.rows.map(toArtistItem),
			albums: albums.rows.map(toAlbumItem),
			totals: { musics: musics.total, artists: artists.total, albums: albums.total },
		};
	}
}
