import { z } from "zod";
import { visibilitySchema } from "../../setting/schemas/setting.schema";

export const providerPublicInfoSchema = z.object({
	uuid: z.string().uuid(),
	visibility: visibilitySchema,
});

export const healthResponseSchema = z.object({
	status: z.literal("ok"),
});
export type HealthResponseDto = z.infer<typeof healthResponseSchema>;
