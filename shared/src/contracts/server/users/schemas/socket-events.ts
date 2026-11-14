import type { PresenceChange, PresenceSnapshot } from "./presence.schema";
import type { ChatError, ChatMessage, SendChatMessageDto } from "./chat.schema";

export interface ServerToClientEvents {
	"presence:snapshot": (snapshot: PresenceSnapshot) => void;
	"presence:changed": (presence: PresenceChange) => void;
	"chat:message": (message: ChatMessage) => void;
	"chat:error": (error: ChatError) => void;
}

export interface ClientToServerEvents {
	"chat:send": (message: SendChatMessageDto) => void;
}
