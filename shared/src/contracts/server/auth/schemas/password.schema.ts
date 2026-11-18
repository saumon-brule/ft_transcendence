import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_BYTES = 72;

export const PasswordSchema = z.string().
	min(PASSWORD_MIN_LENGTH, { message: "PASSWORD_TOO_SHORT" }).
	regex(/[a-z]/, { message: "PASSWORD_NEEDS_LOWERCASE" }).
	regex(/[A-Z]/, { message: "PASSWORD_NEEDS_UPPERCASE" }).
	regex(/\d/, { message: "PASSWORD_NEEDS_DIGIT" }).
	regex(/[^A-Za-z0-9]/, { message: "PASSWORD_NEDDS_SPECIAL" }).
	refine((v) => new TextEncoder().encode(v).length <= PASSWORD_MAX_BYTES, {
		message: "PASSWOWRD_TOO_LONG",
	});

export const changePasswordSchema = z.object({
	oldPassword: z.string(),
	newPassword: PasswordSchema,
});

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

export const requestPasswordResetSchema = z.object({
	email: z.string().email(),
});

export type RequestPasswordResetDto = z.infer<typeof requestPasswordResetSchema>;

export const resetPasswordSchema = z.object({
	token: z.string(),
	newPassword: PasswordSchema,
});

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
