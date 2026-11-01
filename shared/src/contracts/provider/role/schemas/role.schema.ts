import { z } from "zod";

export const providerPermissions = [
	"MANAGE_CATALOG",
	"MANAGE_MEMBERS",
	"MANAGE_ROLES",
] as const;

export type ProviderPermission = (typeof providerPermissions)[number];

export const providerPermissionSchema = z.enum(providerPermissions);

export const providerRoleSummarySchema = z.object({
	uuid: z.string().uuid(),
	name: z.string(),
});

export const providerRoleSchema = providerRoleSummarySchema.extend({
	isDefault: z.boolean(),
	permissions: z.array(providerPermissionSchema),
});

export const providerRoleListResponseSchema = z.object({
	roles: z.array(providerRoleSchema),
});

export const createProviderRoleSchema = z.object({
	name: z.string().trim().min(1).
		max(50),
	permissions: z.array(providerPermissionSchema),
});

export const updateProviderRoleSchema = createProviderRoleSchema.partial();
