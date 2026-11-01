import { z } from "zod";
import { artistItemSchema } from "../../schemas/items.schema";
import { musicListResponseSchema } from "../../music/schemas/music.schema";
import { albumListResponseSchema } from "../../album/schemas/album.schema";

export const artistDetailedItemSchema = z.object({
	uuid: z.string().uuid(),
	name: z.string(),
	addedBy: z.string().uuid().nullable(),
	addedAt: z.coerce.date(),
	biography: z.string().nullable(),
	hasAvatar: z.boolean(),
	music: musicListResponseSchema,
	album: albumListResponseSchema,
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
