import { z } from "zod";
import { musicItemSchema } from "../../music/schemas/music.schema";
import { artistItemSchema } from "../../artist/schemas/artist.schema";

export const albumItemSchema = z.object({
	uuid: z.string(),
	name: z.string(),
	publishedAt: z.date().nullable(),
});

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
