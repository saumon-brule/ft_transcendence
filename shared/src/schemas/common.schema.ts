import z from "zod";

export const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export const uuidParamSchema = z.object({
	uuid: z.string().uuid(),
});

export const DEFAULT_PAGINATION_LIMIT = 20;

export const paginationQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).
		max(10000).
		default(DEFAULT_PAGINATION_LIMIT),
	offset: z.coerce.number().int().min(0).
		default(0),
});

export const listQuerySchema = paginationQuerySchema.extend({
	search: z.string().trim().min(1).
		max(100).
		optional(),
});

export const SEARCH_SORT_FIELDS = ["name", "artist", "album", "published", "duration"] as const;
export const searchSortFieldSchema = z.enum(SEARCH_SORT_FIELDS);
export type SearchSortField = z.infer<typeof searchSortFieldSchema>;

export const sortOrderSchema = z.enum(["asc", "desc"]);
export type SortOrder = z.infer<typeof sortOrderSchema>;

// Without `sort` a list keeps its default order (the relevance when searching).
const sortQuery = <const F extends readonly [SearchSortField, ...SearchSortField[]]>(fields: F) => ({
	sort: z.enum(fields).optional(),
	order: sortOrderSchema.default("asc"),
});

export const MUSIC_SORT_FIELDS = SEARCH_SORT_FIELDS;
export const ALBUM_SORT_FIELDS = ["name", "artist", "published"] as const satisfies readonly SearchSortField[];
export const ARTIST_SORT_FIELDS = ["name"] as const satisfies readonly SearchSortField[];

const filterTextSchema = z.string().trim().min(1).
	max(100).
	optional();
const filterUuidSchema = z.string().uuid().
	optional();
const filterDateSchema = z.coerce.date().optional();

export const musicListQuerySchema = listQuerySchema.extend({
	...sortQuery(MUSIC_SORT_FIELDS),
	name: filterTextSchema,
	artist: filterTextSchema,
	album: filterTextSchema,
	artistUuid: filterUuidSchema,
	albumUuid: filterUuidSchema,
	dateBefore: filterDateSchema,
	dateAfter: filterDateSchema,
});

export const albumListQuerySchema = listQuerySchema.extend({
	...sortQuery(ALBUM_SORT_FIELDS),
	name: filterTextSchema,
	artist: filterTextSchema,
	artistUuid: filterUuidSchema,
	dateBefore: filterDateSchema,
	dateAfter: filterDateSchema,
});

export const artistListQuerySchema = listQuerySchema.extend({
	...sortQuery(ARTIST_SORT_FIELDS),
	name: filterTextSchema,
});

export const searchFiltersSchema = z.object({
	music: filterTextSchema,
	artist: filterTextSchema,
	album: filterTextSchema,
	artistUuid: filterUuidSchema,
	albumUuid: filterUuidSchema,
	dateBefore: filterDateSchema,
	dateAfter: filterDateSchema,
});

export const healthResponseSchema = z.object({
	status: z.literal("ok"),
});
export type HealthResponseDto = z.infer<typeof healthResponseSchema>;

export const healthUnavailableSchema = z.object({
	status: z.literal("error"),
});
export type HealthUnavailableDto = z.infer<typeof healthUnavailableSchema>;
