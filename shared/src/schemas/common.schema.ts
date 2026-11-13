import z from "zod";

export const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

// Ne devrait plus etre utilise a la fin car tout passe par l'uuid
export const idParamSchema = z.object({
	id: z.string().transform(Number),
});

export const uuidParamSchema = z.object({
	uuid: z.string().uuid(),
});

export const DEFAULT_PAGINATION_LIMIT = 20;

export const paginationQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).
		max(100).
		default(DEFAULT_PAGINATION_LIMIT),
	offset: z.coerce.number().int().min(0).
		default(0),
});

export const listQuerySchema = paginationQuerySchema.extend({
	search: z.string().trim().min(1).
		max(100).
		optional(),
});

const filterTextSchema = z.string().trim().min(1).
	max(100).
	optional();
const filterUuidSchema = z.string().uuid().
	optional();
const filterDateSchema = z.coerce.date().optional();

export const musicListQuerySchema = listQuerySchema.extend({
	name: filterTextSchema,
	artist: filterTextSchema,
	album: filterTextSchema,
	artistUuid: filterUuidSchema,
	albumUuid: filterUuidSchema,
	dateBefore: filterDateSchema,
	dateAfter: filterDateSchema,
});

export const albumListQuerySchema = listQuerySchema.extend({
	name: filterTextSchema,
	artist: filterTextSchema,
	artistUuid: filterUuidSchema,
	dateBefore: filterDateSchema,
	dateAfter: filterDateSchema,
});

export const artistListQuerySchema = listQuerySchema.extend({
	name: filterTextSchema,
});

export const searchFiltersSchema = z.object({
	artist: filterTextSchema,
	album: filterTextSchema,
	dateBefore: filterDateSchema,
	dateAfter: filterDateSchema,
});

export const healthResponseSchema = z.object({
	status: z.literal("ok"),
});
export type HealthResponseDto = z.infer<typeof healthResponseSchema>;

export const healthUnavailableSchema = z.object({
	status: z.literal("error"),
});
export type HealthUnavailableDto = z.infer<typeof healthUnavailableSchema>;
