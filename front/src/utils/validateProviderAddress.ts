import { createProviderSchema, isHttpsUrl, PROVIDER_ADDRESS_HTTPS_REQUIRED } from "@flex/shared";
import { translateCode, validateFromZod } from "./validateFromZod";

export function validateProviderAddress(value: string) {
	const error = validateFromZod(createProviderSchema.shape.address, value);
	if (error) return error;
	if (import.meta.env.PROD && !isHttpsUrl(value.trim())) return translateCode(PROVIDER_ADDRESS_HTTPS_REQUIRED);
}
