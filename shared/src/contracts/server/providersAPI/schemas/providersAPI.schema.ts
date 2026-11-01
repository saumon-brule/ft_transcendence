import z from "zod";

export { accessRequestStatusSchema } from "../../providers/schemas/provider.schema";

export const providerApiKeyHeadersSchema = z.object({
	authorization: z.string().startsWith("Bearer "),
});

export const providerIdentitySchema = z.object({
	uuid: z.string().uuid(),
	ownerUuid: z.string().uuid(),
});

export const providerPublicKeySchema = z.object({
	publicKey: z.string().min(1),
});

export const accessRequestUserParamsSchema = z.object({
	userUuid: z.string().uuid(),
});

export const decideAccessRequestSchema = z.object({
	decision: z.enum(["APPROVED", "REJECTED"]),
});
