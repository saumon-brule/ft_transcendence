import { z } from "zod";
import { PasswordSchema } from "./password.schema";

export const registerSchema = z.object({
	email: z.string().email(),
	password: PasswordSchema,
	username: z.string().min(3).max(32),
});

export type RegisterDto = z.infer<typeof registerSchema>;
