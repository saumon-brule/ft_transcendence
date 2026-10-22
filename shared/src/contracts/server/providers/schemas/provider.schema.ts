import { z } from "zod";

export const providerSchema = z.object({
	uuid: z.string().uuid(),
	name: z.string(),
	address: z.string(),
	publicDisplay: z.boolean(),
});

export const createdProviderSchema = providerSchema.extend({
	apiKey: z.string(),
});

function isPlainHttpUrl(value: string) {
	try {
		const url = new URL(value);
		const isHttps = url.protocol === "https:";
		return isHttps && !url.username && !url.password;
	} catch {
		return false;
	}
}

export const createProviderSchema = z.object({
	name: z.string().trim().min(1).
		max(50),
	address: z.string().trim().max(255).
		refine(isPlainHttpUrl, { message: "The address must be an https:// URL, without credentials" }),
	publicDisplay: z.boolean().default(true),
});
export type CreateProviderDto = z.infer<typeof createProviderSchema>;
