import { z } from "zod";

export const artistItemSchema = z.object({
	uuid: z.string().uuid(),
	name: z.string(),
	hasAvatar: z.boolean(),
});

export const albumItemSchema = z.object({
	uuid: z.string().uuid(),
	name: z.string(),
	publishedAt: z.coerce.date().nullable(),
	hasCover: z.boolean(),
	artists: z.array(artistItemSchema),
});

export const musicItemSchema = z.object({
	uuid: z.string().uuid(),
	name: z.string(),
	duration: z.number(),
	publishedAt: z.coerce.date().nullable(),
	hasCover: z.boolean(),
	artists: z.array(artistItemSchema),
	album: albumItemSchema.nullable(),
});
