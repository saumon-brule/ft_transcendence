import { z } from "zod";
import { artistItemSchema, musicItemSchema, albumItemSchema } from "../../schemas/items.schema";

export const musicDetailedItemSchema = z.object({
	uuid: z.string(),
	name: z.string(),
	duration: z.number(),
	publishedAt: z.date().nullable(),
	addedBy: z.string().nullable(),
	addedAt: z.date(),
	artists: z.array(artistItemSchema),
	album: albumItemSchema,
});

export const musicListResponseSchema = z.object({
	musics: z.array(musicItemSchema),
});
