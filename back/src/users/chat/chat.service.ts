import { Injectable } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import { CHAT_MAX_MESSAGE_LENGTH, type ChatError, type ChatMessage } from "@flex/shared";
import { FriendsService } from "../friends/friends.service";
import { PresenceService } from "../presence/presence.service";

function chatException(code: ChatError["error"]["code"], message: string) {
	return new WsException({ code, message } satisfies ChatError["error"]);
}

@Injectable()
export class ChatService {
	private nextMessageId = 0;

	constructor(
		private readonly friendsService: FriendsService,
		private readonly presenceService: PresenceService,
	) {}

	public async sendMessage(senderUUID: string, recipientUUID: string, content: string): Promise<ChatMessage> {
		if (senderUUID === recipientUUID) {
			throw chatException("CHAT_SELF_MESSAGE", "You cannot message yourself");
		}

		const normalizedContent = content.trim();
		if (normalizedContent.length === 0 || normalizedContent.length > CHAT_MAX_MESSAGE_LENGTH) {
			throw chatException("CHAT_INVALID_MESSAGE", `Message must contain between 1 and ${CHAT_MAX_MESSAGE_LENGTH} characters`);
		}

		await this.assertFriends(senderUUID, recipientUUID);

		if (!this.presenceService.isOnline(recipientUUID)) {
			throw chatException("CHAT_RECIPIENT_OFFLINE", "This friend is offline");
		}

		return {
			id: this.nextMessageId++,
			senderUUID,
			recipientUUID,
			content: normalizedContent,
			createdAt: new Date(),
		};
	}

	private async assertFriends(userUUID: string, otherUserUUID: string): Promise<void> {
		if (await this.friendsService.isFriendWith(userUUID, otherUserUUID) !== "YES") {
			throw chatException("CHAT_NOT_FRIENDS", "Chat is only available between friends");
		}
	}
}
