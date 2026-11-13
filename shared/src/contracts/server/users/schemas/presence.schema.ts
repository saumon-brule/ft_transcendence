import { z } from "zod";
import { uuidParamSchema } from "../../../../schemas/common.schema";
import { shortUserSchema } from "./user.schema";

export const presenceSchema = uuidParamSchema.extend({
	online: z.boolean(),
});

export const presenceSnapshotSchema = shortUserSchema.extend({
	online: z.boolean(),
});

export const presenceListSchema = z.array(presenceSnapshotSchema);
export type PresenceSnapshot = z.infer<typeof presenceListSchema>;
