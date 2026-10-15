import { z } from "zod";

export const providerSchema = z.object({
	uuid: z.string().uuid(),
	name: z.string(),
	adress: z.string(),
	publicDisplay: z.boolean(),
});

function isPlainHttpUrl(value: string) {
	try {
		const url = new URL(value);
		const isHttp = url.protocol === "http:" || url.protocol === "https:";
		return isHttp && !url.username && !url.password;
	} catch {
		return false;
	}
}

export const createProviderSchema = z.object({
	name: z.string().trim().min(1).
		max(50),
	// Adresse à laquelle le provider est joignable, par exemple https://music.example.com
	adress: z.string().trim().max(255).
		refine(isPlainHttpUrl, { message: "The address must be an http:// or https:// URL, without credentials" }),
	publicDisplay: z.boolean().default(true),
});
export type CreateProviderDto = z.infer<typeof createProviderSchema>;
