import { z } from "zod";
import { paginationQuerySchema } from "../../../../schemas/common.schema";

export const requestStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);

export const accessRequestSchema = z.object({
	token: z.string(),
});

export const accessRequestStatusSchema = z.object({
	uuid: z.string().uuid(),
	userUuid: z.string().uuid(),
	status: requestStatusSchema,
	decidedBy: z.string().uuid().nullable(),
	decidedAt: z.coerce.date().nullable(),
	createdAt: z.coerce.date(),
});

export const accessRequestListQuerySchema = paginationQuerySchema.extend({
	status: requestStatusSchema.optional(),
});

export const accessRequestListResponseSchema = z.object({
	accessRequests: z.array(accessRequestStatusSchema),
	total: z.number(),
});

export const decideAccessRequestSchema = z.object({
	decision: z.enum(["APPROVED", "REJECTED"]),
});
