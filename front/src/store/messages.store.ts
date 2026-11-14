import { untrack } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { chatErrorSchema, chatMessageSchema, presenceSchema, type ChatError, type ChatErrorCode } from "@flex/shared";
import { socket } from "~/api/socket";
import { summonErrorToast } from "~/components/ui/Toaster";
import { auth } from "./auth.store";

type Message = {
	id: number;
	author: "me" | "friend";
	content: string;
	timestamp: Date;
};
type Chat = { draft: string; isRead: boolean; messages: Message[] };
type ChatStore = { chats: Record<string, Chat> };

const CHAT_ERROR_MESSAGES: Record<ChatErrorCode, string> = {
	CHAT_INVALID_PAYLOAD: "Invalid message",
	CHAT_INVALID_MESSAGE: "Invalid message",
	CHAT_SELF_MESSAGE: "You cannot message yourself",
	CHAT_NOT_FRIENDS: "You can only chat with your friends",
	CHAT_RECIPIENT_OFFLINE: "This friend is offline",
};

const [chatStore, setChatStore] = createStore<ChatStore>({ chats: {} });

function ensureChat(userUuid: string) {
	if (!chatStore.chats[userUuid]) setChatStore("chats", userUuid, { draft: "", isRead: true, messages: [] });
}

function openChat(userUuid: string) {
	ensureChat(userUuid);
	setChatStore("chats", userUuid, "isRead", true);
	return chatStore.chats[userUuid];
}

function setDraft(userUuid: string, draft: string) {
	ensureChat(userUuid);
	setChatStore("chats", userUuid, "draft", draft);
}

function receiveMessage(userUuid: string, message: Message) {
	ensureChat(userUuid);
	if (message.author === "friend") {
		setChatStore("chats", userUuid, "isRead", false);
	}
	setChatStore("chats", userUuid, "messages", (messages) => [...messages, message]);
}

function sendMessage(userUuid: string, content: string) {
	socket.emit("chat:send", { recipientUUID: userUuid, content });
}

function endChat(userUuid: string) {
	setChatStore("chats", produce((chats) => {
		delete chats[userUuid];
	}));
}

function clearChats() {
	setChatStore({ chats: {} });
}

function markAsRead(userUuid: string) {
	ensureChat(userUuid);
	setChatStore("chats", userUuid, "isRead", true);
}

function hasUnreadMessages(userUuid?: string) {
	if (userUuid) return chatStore.chats[userUuid]?.isRead === false;
	return Object.values(chatStore.chats).some((chat) => !chat.isRead);
}

function onChatMessage(payload: unknown) {
	const parsed = chatMessageSchema.safeParse(payload);
	const myUuid = untrack(() => auth.accessToken === null ? null : auth.jwtPayload.sub);
	if (!parsed.success || myUuid === null) return;

	const { id, senderUUID, recipientUUID, content, createdAt } = parsed.data;
	const fromMe = senderUUID === myUuid;
	receiveMessage(fromMe ? recipientUUID : senderUUID, {
		id,
		author: fromMe ? "me" : "friend",
		content,
		timestamp: createdAt,
	});
}

socket.on("chat:message", (payload) => untrack(() => onChatMessage(payload)));

socket.on("chat:error", (payload: ChatError) => {
	const parsed = chatErrorSchema.safeParse(payload);
	summonErrorToast(() => parsed.success
		? CHAT_ERROR_MESSAGES[parsed.data.error.code]
		: "Failed to send the message");
});

socket.on("presence:changed", (payload) => {
	const change = presenceSchema.safeParse(payload);
	if (change.success && !change.data.online) endChat(change.data.uuid);
});

socket.on("disconnect", clearChats);

export {
	endChat,
	openChat,
	setDraft,
	sendMessage,
	markAsRead,
	hasUnreadMessages,
};
