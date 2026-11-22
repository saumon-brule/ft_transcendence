import { z } from "zod";
import { providerMemberSchema } from "../../member/schemas/member.schema";

export const requestStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);

export const accessRequestStatusSchema = z.object({
	uuid: z.string().uuid(),
	userUuid: z.string().uuid(),
	status: requestStatusSchema,
	decidedBy: z.string().uuid().nullable(),
	decidedAt: z.coerce.date().nullable(),
	createdAt: z.coerce.date(),
});

export const myAccessRequestResponseSchema = z.object({
	accessRequest: accessRequestStatusSchema.nullable(),
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

export const accessRequestDecideResponseSchema = accessRequestStatusSchema.extend({
	member: providerMemberSchema.nullable(),
});
