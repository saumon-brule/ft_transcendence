import { createStore, produce } from "solid-js/store";
import type { ClientToServerEvents, ServerToClientEvents } from "@flex/shared";
import type { Socket } from "socket.io-client";

export type Message = {
	id: number;
	author: "me" | "friend";
	content: string;
	timestamp: Date;
};
type Chat = { draft: string; isRead: boolean; messages: Message[] };
type ChatStore = { chats: Record<string, Chat> };

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

function sendMessage(socket: Socket<ServerToClientEvents, ClientToServerEvents>, userUuid: string, content: string) {
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

export {
	endChat,
	openChat,
	setDraft,
	sendMessage,
	receiveMessage,
	markAsRead,
	hasUnreadMessages,
	clearChats,
};
