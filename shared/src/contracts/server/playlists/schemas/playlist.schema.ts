import { z } from "zod";
import { uuidParamSchema } from "../../../../schemas/common.schema";

export const createPlaylistBodySchema = z.object({
	name: z.string().trim().min(1).
		max(100),
	private: z.boolean().default(false),
});

export const musicPathParamsSchema = uuidParamSchema.extend({
	musicUUID: z.string().uuid(),
});

export const createdPlaylistSchema = z.object({
	uuid: z.string().uuid(),
	name: z.string(),
	private: z.boolean(),
});
