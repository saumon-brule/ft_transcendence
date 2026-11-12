import { z } from "zod";
import { uuidParamSchema } from "../../../../schemas/common.schema";

export const createPlaylistBodySchema = z.object({
	name: z.string().trim().min(1).
		max(64),
	private: z.boolean().default(false),
});

export const musicPathParamsSchema = uuidParamSchema.extend({
	musicUUID: z.string().uuid(),
	providerUUID: z.string().uuid(),
});

export const createdPlaylistSchema = z.object({
	uuid: z.string().uuid(),
	name: z.string(),
	private: z.boolean(),
});

export const MusicBodySchema = z.object({
	musicUUID: z.string().uuid(),
	providerUUID: z.string().uuid(),
});

export const updatePlaylistNameSchema = z.object({
	name: z.string().min(1).max(64),
});

export const updatePlaylistPrivacySchema = z.object({
	private: z.boolean(),
});
