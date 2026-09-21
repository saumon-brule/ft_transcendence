import { z } from "zod";
import { artistItemSchema, musicItemSchema, albumItemSchema } from "../../schemas/items.schema";

export const albumDetailedItemSchema = z.object({
	uuid: z.string(),
	name: z.string(),
	addedBy: z.string().nullable(),
	addedAt: z.coerce.date(),
	publishedAt: z.coerce.date().nullable(),
	musics: z.array(musicItemSchema),
	artists: z.array(artistItemSchema),
});

export const albumListResponseSchema = z.object({
	albums: z.array(albumItemSchema),
	total: z.number(),
});

export const createAlbumSchema = z.object({
	name: z.string().trim().min(1).max(200),
	publishedAt: z.coerce.date().nullable().optional(),
	artistUuids: z.array(z.string().uuid()),
});

export const updateAlbumSchema = createAlbumSchema.partial();
