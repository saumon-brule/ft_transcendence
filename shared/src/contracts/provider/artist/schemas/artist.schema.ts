import { z } from "zod";
import { musicItemSchema } from "../../music/schemas/music.schema";
import { albumItemSchema } from "../../album/schemas/album.schema";

export const artistItemSchema = z.object({
	uuid: z.string(),
	name: z.string(),
});

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
