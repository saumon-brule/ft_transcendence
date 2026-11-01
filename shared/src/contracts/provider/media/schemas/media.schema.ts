import { z } from "zod";

export const mediaTokenResponseSchema = z.object({
	token: z.string(),
	expiresAt: z.coerce.date(),
});
