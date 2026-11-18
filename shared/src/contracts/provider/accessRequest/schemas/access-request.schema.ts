import { z } from "zod";

export const requestStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);

export const accessRequestStatusSchema = z.object({
	uuid: z.string().uuid(),
	userUuid: z.string().uuid(),
	status: requestStatusSchema,
	decidedBy: z.string().uuid().nullable(),
	decidedAt: z.coerce.date().nullable(),
	createdAt: z.coerce.date(),
});

export const accessRequestListQuerySchema = z.object({
	status: requestStatusSchema.optional(),
});

export const accessRequestListResponseSchema = z.object({
	accessRequests: z.array(accessRequestStatusSchema),
});

export const decideAccessRequestSchema = z.object({
	decision: z.enum(["APPROVED", "REJECTED"]),
});
