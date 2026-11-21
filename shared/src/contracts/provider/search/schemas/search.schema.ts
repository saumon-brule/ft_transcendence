import { z } from "zod";
import { searchFiltersSchema, searchSortFieldSchema, sortOrderSchema } from "../../../../schemas/common.schema";
import { artistItemSchema, musicItemSchema, albumItemSchema } from "../../schemas/items.schema";

export const SEARCH_MAX_LIMIT = 100;

export const searchQuerySchema = searchFiltersSchema.extend({
	query: z.string().trim().min(1).
		max(100).
		optional(),
	limit: z.coerce.number().int().min(1).
		max(SEARCH_MAX_LIMIT).
		default(10),
	// Without `sort` the results are ordered by relevance. A field that does not exist on a kind of result
	// (e.g. `album` for an artist) is ignored for this kind.
	sort: searchSortFieldSchema.optional(),
	order: sortOrderSchema.default("asc"),
});

export const searchResponseSchema = z.object({
	musics: z.array(musicItemSchema),
	artists: z.array(artistItemSchema),
	albums: z.array(albumItemSchema),
	totals: z.object({
		musics: z.number().int(),
		artists: z.number().int(),
		albums: z.number().int(),
	}),
});
