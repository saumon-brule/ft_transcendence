import { z } from "zod";
import { albumItemSchema } from "../../album/schemas/album.schema";
import { artistItemSchema } from "../../artist/schemas/artist.schema";

export const musicItemSchema = z.object({
	uuid: z.string(),
	name: z.string(),
	duration: z.number(),
	publishedAt: z.date().nullable(),
	artists: z.array(artistItemSchema),
	album: albumItemSchema,
});

export const musicListResponseSchema = z.object({
	musics: z.array(musicItemSchema),
});
