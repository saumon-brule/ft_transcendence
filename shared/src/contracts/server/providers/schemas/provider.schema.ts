import { z } from "zod";

export const providerSchema = z.object({
	uuid: z.string().uuid(),
	name: z.string(),
	address: z.string(),
});
export type Provider = z.infer<typeof providerSchema>;

export const searchProvidersQuerySchema = z.object({
	name: z.string().trim().min(1).
		max(100).
		optional(),
});

export const createdProviderSchema = providerSchema.extend({
	apiKey: z.string(),
});

export const regenerateKeyProviderSchema = z.object({
	apiKey: z.string(),
});

function isPlainHttpUrl(value: string) {
	try {
		const url = new URL(value);
		const isHttps = url.protocol === "https:";
		const isHttp = url.protocol === "http:";
		return (isHttps || isHttp) && !url.username && !url.password;
	} catch {
		return false;
	}
}

export function isHttpsUrl(value: string) {
	try {
		return new URL(value).protocol === "https:";
	} catch {
		return false;
	}
}

export const PROVIDER_ADDRESS_INVALID = "PROVIDER_ADDRESS_INVALID";
export const PROVIDER_ADDRESS_HTTPS_REQUIRED = "PROVIDER_ADDRESS_HTTPS_REQUIRED";

export const createProviderSchema = z.object({
	name: z.string().trim().min(1).
		max(50),
	address: z.string().trim().max(255).
		refine(isPlainHttpUrl, { message: PROVIDER_ADDRESS_INVALID }),
});
export type CreateProviderDto = z.infer<typeof createProviderSchema>;

export const editProviderSchema = createProviderSchema.partial();

export const accessRequestStatusSchema = z.object({
	status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
});

export const providerTokenSchema = z.object({
	token: z.string(),
	expiresAt: z.coerce.date(),
});
