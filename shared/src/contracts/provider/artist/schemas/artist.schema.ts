import { z } from "zod";
import { artistItemSchema, musicItemSchema, albumItemSchema } from "../../schemas/items.schema";

export const artistDetailedItemSchema = z.object({
	uuid: z.string().uuid(),
	name: z.string(),
	addedBy: z.string().uuid().nullable(),
	addedAt: z.coerce.date(),
	biography: z.string().nullable(),
	hasAvatar: z.boolean(),
	musics: z.array(musicItemSchema),
	albums: z.array(albumItemSchema),
});

export const artistListResponseSchema = z.object({
	artists: z.array(artistItemSchema),
	total: z.number(),
});

export const createArtistSchema = z.object({
	name: z.string().trim().min(1).
		max(200),
	biography: z.string().max(5000).nullable().
		optional(),
});

export const updateArtistSchema = createArtistSchema.partial();
