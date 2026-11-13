import { Injectable } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import { FriendsService } from "../friends/friends.service";

@Injectable()
export class ChatService {
	private static readonly MAX_MESSAGE_LENGTH = 256;
	private nextMessageId = 0;

	constructor(private readonly friendsService: FriendsService) {}

	public async sendMessage(senderUUID: string, recipientUUID: string, content: string) {
		if (senderUUID === recipientUUID) {
			throw new WsException({ code: "CHAT_SELF_MESSAGE", message: "You cannot message yourself" });
		}

		const normalizedContent = content.trim();
		if (normalizedContent.length === 0 || normalizedContent.length > ChatService.MAX_MESSAGE_LENGTH) {
			throw new WsException({
				code: "CHAT_INVALID_MESSAGE",
				message: `Message must contain between 1 and ${ChatService.MAX_MESSAGE_LENGTH} characters`,
			});
		}

		await this.assertFriends(senderUUID, recipientUUID);

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
			throw new WsException({
				code: "CHAT_NOT_FRIENDS",
				message: "Chat is only available between friends",
			});
		}
	}
}
