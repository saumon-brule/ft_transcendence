import { z } from "zod";
import { artistItemSchema, musicItemSchema, albumItemSchema } from "../../schemas/items.schema";

export const searchQuerySchema = z.object({
	query: z.string().trim().min(1).
		max(100),
	limit: z.coerce.number().int().min(1).
		max(50).
		default(10),
});

export const searchResponseSchema = z.object({
	musics: z.array(musicItemSchema),
	artists: z.array(artistItemSchema),
	albums: z.array(albumItemSchema),
});
