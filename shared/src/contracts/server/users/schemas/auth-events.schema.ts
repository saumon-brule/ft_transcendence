import { z } from "zod";

export const authRefreshSchema = z.object({
	token: z.string().min(1),
});
export type AuthRefreshDto = z.infer<typeof authRefreshSchema>;

export const authRefreshResultSchema = z.object({
	ok: z.boolean(),
});
export type AuthRefreshResult = z.infer<typeof authRefreshResultSchema>;
