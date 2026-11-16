import { useLocation, useNavigate } from "@solidjs/router";
import { chatErrorSchema, chatMessageSchema, presenceSchema, type ChatError, type ChatErrorCode } from "@flex/shared";
import type { AppSocket } from "~/api/socket";
import { summonErrorToast, summonInfoToast } from "~/components/ui/Toaster";
import { auth } from "~/store/auth.store";
import { clearChats, endChat, getChat, receiveMessage } from "~/store/messages.store";

const CHAT_ERROR_MESSAGES: Record<ChatErrorCode, string> = {
	CHAT_INVALID_PAYLOAD: "Invalid message",
	CHAT_INVALID_MESSAGE: "Invalid message",
	CHAT_SELF_MESSAGE: "You cannot message yourself",
	CHAT_NOT_FRIENDS: "You can only chat with your friends",
	CHAT_RECIPIENT_OFFLINE: "This friend is offline",
};

export function useChatEvents(socket: AppSocket) {
	const navigate = useNavigate();
	const location = useLocation();

	socket.on("chat:message", (payload) => {
		const parsed = chatMessageSchema.safeParse(payload);
		const myUuid = auth.accessToken === null ? null : auth.jwtPayload.sub;
		if (!parsed.success || myUuid === null) return;

		const { id, senderUUID, recipientUUID, content, createdAt } = parsed.data;
		const fromMe = senderUUID === myUuid;
		const friendUuid = fromMe ? recipientUUID : senderUUID;

		receiveMessage(friendUuid, {
			id,
			type: "message",
			author: fromMe ? "me" : "friend",
			content,
			timestamp: createdAt,
		});

		const isConversationOpen = location.pathname === `/friends/${friendUuid}`;
		if (!fromMe && !isConversationOpen) {
			summonInfoToast(<span onClick={() => navigate(`/friends/${friendUuid}`)}>{content}</span>);
		}
	});

	socket.on("chat:error", (payload: ChatError) => {
		const parsed = chatErrorSchema.safeParse(payload);
		summonErrorToast(() => parsed.success
			? CHAT_ERROR_MESSAGES[parsed.data.error.code]
			: "Failed to send the message");
	});

	socket.on("presence:changed", (payload) => {
		const change = presenceSchema.safeParse(payload);
		if (change.success && getChat(change.data.uuid)?.messages.length)
			receiveMessage(change.data.uuid, {
				id: 0,
				type: "info",
				author: "friend",
				content: change.data.online ? "reconnected" : "disconnected",
				timestamp: new Date(),
			});
	});

	socket.on("disconnect", clearChats);
}
