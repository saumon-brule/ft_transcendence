import { z } from "zod";
import { PasswordSchema } from "./password.schema";
import { languageEnum } from "../../users/schemas/user.schema";

export const registerSchema = z.object({
	email: z.string().email(),
	password: PasswordSchema,
	username: z.string().
		trim().
		min(3).
		max(32),
	language: languageEnum.optional(),
});

export type RegisterDto = z.infer<typeof registerSchema>;
