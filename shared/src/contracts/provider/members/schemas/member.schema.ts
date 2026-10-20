import { z } from "zod";
import { paginationQuerySchema } from "../../../../schemas/common.schema";
import { providerPermissionSchema, providerRoleSummarySchema } from "../../roles/schemas/role.schema";

export const providerMemberSchema = z.object({
	uuid: z.string().uuid(),
	isOwner: z.boolean(),
	revokedAt: z.coerce.date().nullable(),
	createdAt: z.coerce.date(),
	roles: z.array(providerRoleSummarySchema),
});

export const providerMemberProfileSchema = z.object({
	uuid: z.string().uuid(),
	isOwner: z.boolean(),
	roles: z.array(providerRoleSummarySchema),
	permissions: z.array(providerPermissionSchema),
});

export const providerMemberListQuerySchema = paginationQuerySchema.extend({
	revoked: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
});

export const providerMemberListResponseSchema = z.object({
	members: z.array(providerMemberSchema),
	total: z.number(),
});

export const setMemberRolesSchema = z.object({
	roleUuids: z.array(z.string().uuid()),
});
