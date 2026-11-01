import { z } from "zod";
import { shortUserSchema } from "./user.schema";

export const friendsSchema = z.array(
	shortUserSchema,
);

export const isFriendWithResponseSchema = z.object({
	isFriend: z.enum(["YES", "NO", "PENDING"]),
});
export type FriendRelation = z.infer<typeof isFriendWithResponseSchema>["isFriend"];

export const isFriendWithQuerySchema = z.object({
	userUuid1: z.string().uuid(),
	userUuid2: z.string().uuid(),
});

export const friendUuidParamSchema = z.object({
	friendUuid: z.string().uuid(),
});

export const requestBodySchema = z.object({
	targetUuid: z.string().uuid(),
});

export const manageRequestBodySchema = z.object({
	status: z.enum(["ACCEPTED", "DENIED"]),
});
export type FriendRequestAnswer = z.infer<typeof manageRequestBodySchema>["status"];

export const requesterUuidParamSchema = z.object({
	requesterUuid: z.string().uuid(),
});
