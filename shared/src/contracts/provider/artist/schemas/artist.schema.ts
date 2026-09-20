import { z } from "zod";
import { artistItemSchema, musicItemSchema, albumItemSchema } from "../../schemas/items.schema";

export const artistDetailedItemSchema = z.object({
	uuid: z.string(),
	name: z.string(),
	addedBy: z.string().nullable(),
	addedAt: z.date(),
	biography: z.string().nullable(),
	musics: z.array(musicItemSchema),
	albums: z.array(albumItemSchema),
});

export const artistListResponseSchema = z.object({
	artists: z.array(artistItemSchema),
});
