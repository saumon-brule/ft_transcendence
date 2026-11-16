import { z } from "zod";

export const CHAT_MAX_MESSAGE_LENGTH = 256;

export const chatErrorCodeSchema = z.enum([
	"CHAT_INVALID_PAYLOAD",
	"CHAT_INVALID_MESSAGE",
	"CHAT_SELF_MESSAGE",
	"CHAT_NOT_FRIENDS",
	"CHAT_RECIPIENT_OFFLINE",
]);
export type ChatErrorCode = z.infer<typeof chatErrorCodeSchema>;

export const sendChatMessageSchema = z.object({
	recipientUUID: z.string().uuid(),
	content: z.string().trim().min(1).
		max(CHAT_MAX_MESSAGE_LENGTH),
});
export type SendChatMessageDto = z.infer<typeof sendChatMessageSchema>;

export const chatMessageSchema = z.object({
	id: z.number().int(),
	senderUUID: z.string().uuid(),
	recipientUUID: z.string().uuid(),
	content: z.string(),
	createdAt: z.coerce.date(),
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const chatErrorSchema = z.object({
	event: z.string(),
	error: z.object({
		code: chatErrorCodeSchema,
		message: z.string(),
	}),
});
export type ChatError = z.infer<typeof chatErrorSchema>;
