import { createStore } from "solid-js/store";

type Message = {
	author: "me" | "friend";
	content: string;
	timestamp: Date;
};
type Chat = { draft: string; isRead: boolean; messages: Message[] };
type ChatStore = { chats: Record<string, Chat> };

const [chatStore, setChatStore] = createStore<ChatStore>({ chats: {} });

function ensureChat(userUuid: string) {
	if (!chatStore.chats[userUuid])
		setChatStore("chats", userUuid, { draft: "", isRead: true, messages: [] });
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

function addMessage(userUuid: string, message: Message) {
	ensureChat(userUuid);
	if (message.author === "friend") {
		setChatStore("chats", userUuid, "isRead", false);
	}
	setChatStore("chats", userUuid, "messages", msgs => [...msgs, message]);
	// send future webscoket
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
	return Object.values(chatStore.chats).some(chat => !chat.isRead);
}


export {
	openChat,
	setDraft,
	addMessage,
	markAsRead,
	clearChats,
	hasUnreadMessages
};
