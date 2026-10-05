import z from "zod";

// Ne devrait plus etre utilise a la fin car tout passe par l'uuid
export const idParamSchema = z.object({
	id: z.string().transform(Number),
});

export const uuidParamSchema = z.object({
	uuid: z.string().uuid(),
});
