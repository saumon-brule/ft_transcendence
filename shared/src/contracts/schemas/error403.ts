import { z } from "zod";

function error403SchemaVariant<T extends readonly [string, ...string[]]>(enumArray: T) {
	return z.object({
		statusCode: z.literal(403),
		error: z.string(),
		message: z.string(),
		code: z.enum(enumArray),
	});
}

export const serverCode403 = [
	"INVALID_PERMISSION",
	"EMAIL_NOT_VERIFIED",
	"ALREADY_LOGGED_IN",
	"FORBIDDEN",
] as const;

export const providerCode403 = [
	"INVALID_PERMISSION",
	"NOT_A_MEMBER",
	"MEMBER_REVOKED",
	"FORBIDDEN",
] as const;

export const code403 = [...serverCode403, ...providerCode403] as const;

export type ServerCode403 = (typeof serverCode403)[number];
export type ProviderCode403 = (typeof providerCode403)[number];
export type Code403 = (typeof code403)[number];

export const error403ServerSchema = error403SchemaVariant(serverCode403);
export const error403ProviderSchema = error403SchemaVariant(providerCode403);

//	remove it later when shared is correctly splited
export const error403Schema = error403ServerSchema;
