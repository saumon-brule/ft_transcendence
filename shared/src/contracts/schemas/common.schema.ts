import z from "zod";

// Ne devrait plus etre utilise a la fin car tout passe par l'uuid
export const idParamSchema = z.object({
	id: z.string().transform(Number),
});

export const uuidParamSchema = z.object({
	uuid: z.string().uuid(),
});

export const paginationQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(100).default(20),
	offset: z.coerce.number().int().min(0).default(0),
});

export const listQuerySchema = paginationQuerySchema.extend({
	search: z.string().trim().min(1).max(100).optional(),
});
