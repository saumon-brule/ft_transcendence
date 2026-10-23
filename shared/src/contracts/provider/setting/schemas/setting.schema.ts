import { z } from "zod";

export const visibilitySchema = z.enum(["PUBLIC", "PRIVATE"]);

export const providerSettingSchema = z.object({
	ownerUuid: z.string().uuid(),
	visibility: visibilitySchema,
	defaultRoleUuid: z.string().uuid().nullable(),
});

export const updateProviderSettingSchema = z.object({
	visibility: visibilitySchema.optional(),
	defaultRoleUuid: z.string().uuid().nullable().
		optional(),
});
