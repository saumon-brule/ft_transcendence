import type { PresenceChange, PresenceSnapshot } from "./presence.schema";
import type { FriendRemoved, FriendRequestAccepted, FriendRequestDenied, FriendRequestReceived } from "./friend-events.schema";
import type { AuthRefreshDto, AuthRefreshResult } from "./auth-events.schema";
import type { ChatError, ChatMessage, SendChatMessageDto } from "./chat.schema";

export interface ServerToClientEvents {
	"presence:snapshot": (snapshot: PresenceSnapshot) => void;
	"presence:changed": (presence: PresenceChange) => void;
	"friend:request-received": (user: FriendRequestReceived) => void;
	"friend:request-accepted": (friend: FriendRequestAccepted) => void;
	"friend:request-denied": (user: FriendRequestDenied) => void;
	"friend:removed": (friend: FriendRemoved) => void;
	"chat:message": (message: ChatMessage) => void;
	"chat:error": (error: ChatError) => void;
}

export interface ClientToServerEvents {
	"auth:refresh": (payload: AuthRefreshDto, ack?: (result: AuthRefreshResult) => void) => void;
	"chat:send": (message: SendChatMessageDto) => void;
}
