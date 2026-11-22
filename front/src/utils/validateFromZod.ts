import z, { ZodSchema } from "zod";
import { PASSWORD_MAX_BYTES, PASSWORD_MIN_LENGTH, PROVIDER_ADDRESS_HTTPS_REQUIRED, PROVIDER_ADDRESS_INVALID } from "@flex/shared";
import { t } from "~/i18n/context";

const CODE_MESSAGES: Record<string, () => string> = {
	PASSWORD_TOO_SHORT: () => t("errors.input.password.tooShort", { min: String(PASSWORD_MIN_LENGTH) }),
	PASSWORD_NEEDS_LOWERCASE: () => t("errors.input.password.needsLowercase"),
	PASSWORD_NEEDS_UPPERCASE: () => t("errors.input.password.needsUppercase"),
	PASSWORD_NEEDS_DIGIT: () => t("errors.input.password.needsDigit"),
	PASSWORD_NEEDS_SPECIAL: () => t("errors.input.password.needsSpecial"),
	PASSWORD_TOO_LONG: () => t("errors.input.password.tooLong", { max: String(PASSWORD_MAX_BYTES) }),
	[PROVIDER_ADDRESS_INVALID]: () => t("errors.input.providerAddress.invalid"),
	[PROVIDER_ADDRESS_HTTPS_REQUIRED]: () => t("errors.input.providerAddress.httpsRequired"),
};

export function translateCode(message: string) {
	return CODE_MESSAGES[message]?.() ?? message;
}

function firstMessage(error: z.ZodError) {
	return translateCode(error.issues[0].message);
}

export function validatorFromZod<S extends ZodSchema>(zodSchema: S) {
	return (input: z.input<typeof zodSchema>) => {
		const result = zodSchema.safeParse(input);
		if (!result.success) return firstMessage(result.error);
	};
}

export function validateFromZod<S extends ZodSchema>(zodSchema: S, input: z.input<typeof zodSchema>) {
	const result = zodSchema.safeParse(input);
	if (!result.success) return firstMessage(result.error);
}
