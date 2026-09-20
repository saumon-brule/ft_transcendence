import { z } from "zod";

export const artistItemSchema = z.object({
	uuid: z.string(),
	name: z.string(),
});

export const albumItemSchema = z.object({
	uuid: z.string(),
	name: z.string(),
	publishedAt: z.date().nullable(),
});

export const musicItemSchema = z.object({
	uuid: z.string(),
	name: z.string(),
	duration: z.number(),
	publishedAt: z.date().nullable(),
	artists: z.array(artistItemSchema),
	album: albumItemSchema,
});
