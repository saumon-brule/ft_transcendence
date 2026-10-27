import { z } from "zod";
import { artistItemSchema, albumItemSchema } from "../../schemas/items.schema";
import { musicListResponseSchema } from "../../music/schemas/music.schema";

export const artistDetailedItemSchema = z.object({
	uuid: z.string().uuid(),
	name: z.string(),
	addedBy: z.string().uuid().nullable(),
	addedAt: z.coerce.date(),
	biography: z.string().nullable(),
	hasAvatar: z.boolean(),
	music: musicListResponseSchema,
	albums: z.array(albumItemSchema),
});
export type ArtistDetailedItemDto = z.infer<typeof artistDetailedItemSchema>;

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
