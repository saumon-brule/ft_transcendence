import { z } from "zod";
import { uuidParamSchema } from "../../../../schemas/common.schema";
import { shortUserSchema } from "./user.schema";
import { presenceSnapshotSchema } from "./presence.schema";

export const friendRequestReceivedSchema = shortUserSchema;
export type FriendRequestReceived = z.infer<typeof friendRequestReceivedSchema>;

export const friendRequestAcceptedSchema = presenceSnapshotSchema;
export type FriendRequestAccepted = z.infer<typeof friendRequestAcceptedSchema>;

export const friendRequestDeniedSchema = shortUserSchema;
export type FriendRequestDenied = z.infer<typeof friendRequestDeniedSchema>;

export const friendRemovedSchema = uuidParamSchema;
export type FriendRemoved = z.infer<typeof friendRemovedSchema>;
