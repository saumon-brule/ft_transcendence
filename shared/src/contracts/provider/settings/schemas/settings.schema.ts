import { z } from "zod";

export const visibilitySchema = z.enum(["PUBLIC", "PRIVATE"]);

export const providerSettingsSchema = z.object({
	ownerUuid: z.string().uuid(),
	visibility: visibilitySchema,
	defaultRoleUuid: z.string().uuid().nullable(),
});

export const updateProviderSettingsSchema = z.object({
	visibility: visibilitySchema.optional(),
	defaultRoleUuid: z.string().uuid().nullable().
		optional(),
});
