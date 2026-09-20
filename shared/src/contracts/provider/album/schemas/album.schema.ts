import { z } from "zod";
import { artistItemSchema, musicItemSchema, albumItemSchema } from "../../schemas/items.schema";

export const albumDetailedItemSchema = z.object({
	uuid: z.string(),
	name: z.string(),
	addedBy: z.string().nullable(),
	addedAt: z.date(),
	publishedAt: z.date().nullable(),
	musics: z.array(musicItemSchema),
	artists: z.array(artistItemSchema),
});

export const albumListResponseSchema = z.object({
	albums: z.array(albumItemSchema),
});
