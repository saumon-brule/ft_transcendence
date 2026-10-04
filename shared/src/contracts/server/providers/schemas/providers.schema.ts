import z from "zod";

export const providerApiKeyHeadersSchema = z.object({
	authorization: z.string().startsWith("Bearer "),
});

export const providerIdentitySchema = z.object({
	uuid: z.string().uuid(),
	ownerUuid: z.string().uuid(),
});

export const providerPublicKeySchema = z.object({
	// Clé publique RS256 du server, au format PEM (SPKI)
	publicKey: z.string().min(1),
});
