import { z } from "zod";

export const artistItemSchema = z.object({
	uuid: z.string().uuid(),
	name: z.string(),
});

export const albumItemSchema = z.object({
	uuid: z.string().uuid(),
	name: z.string(),
	publishedAt: z.coerce.date().nullable(),
});

export const musicItemSchema = z.object({
	uuid: z.string().uuid(),
	name: z.string(),
	duration: z.number(),
	publishedAt: z.coerce.date().nullable(),
	artists: z.array(artistItemSchema),
	album: albumItemSchema.nullable(),
});
