import { z } from "zod";
import { artistItemSchema, musicItemSchema, albumItemSchema } from "../../schemas/items.schema";

export const musicDetailedItemSchema = z.object({
	uuid: z.string(),
	name: z.string(),
	duration: z.number(),
	publishedAt: z.coerce.date().nullable(),
	addedBy: z.string().nullable(),
	addedAt: z.coerce.date(),
	artists: z.array(artistItemSchema),
	album: albumItemSchema.nullable(),
});

export const musicListResponseSchema = z.object({
	musics: z.array(musicItemSchema),
	total: z.number(),
});

export const createMusicSchema = z.object({
	name: z.string().trim().min(1).
		max(200),
	duration: z.number().int().positive(),
	publishedAt: z.coerce.date().nullable().optional(),
	albumUuid: z.string().uuid().nullable().
		optional(),
	artistUuids: z.array(z.string().uuid()),
});

export const updateMusicSchema = createMusicSchema.partial();

export const audioUrlResponseSchema = z.object({
	url: z.string().url(),
	expiresAt: z.coerce.date(),
});
