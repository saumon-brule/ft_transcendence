import { Injectable } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import { PrismaService } from "../../core/prisma/prisma.service";
import { FriendsService } from "../friends/friends.service";

@Injectable()
export class ChatService {
	private static readonly MAX_MESSAGE_LENGTH = 256;
	private static readonly DEFAULT_PAGE_SIZE = 50;
	private static readonly MAX_PAGE_SIZE = 100;

	constructor(
		private readonly prisma: PrismaService,
		private readonly friendsService: FriendsService,
	) {}

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

		return this.prisma.chatMessage.create({
			data: { senderUUID, recipientUUID, content: normalizedContent },
			select: {
				id: true,
				senderUUID: true,
				recipientUUID: true,
				content: true,
				createdAt: true,
			},
		});
	}

	public async getHistory(
		userUUID: string,
		otherUserUUID: string,
		beforeMessageId?: number,
		requestedLimit?: number,
	) {
		if (userUUID === otherUserUUID) {
			throw new WsException({ code: "CHAT_SELF_HISTORY", message: "Invalid conversation" });
		}

		await this.assertFriends(userUUID, otherUserUUID);

		const limit = requestedLimit ?? ChatService.DEFAULT_PAGE_SIZE;
		if (!Number.isInteger(limit) || limit < 1 || limit > ChatService.MAX_PAGE_SIZE) {
			throw new WsException({
				code: "CHAT_INVALID_LIMIT",
				message: `History limit must be between 1 and ${ChatService.MAX_PAGE_SIZE}`,
			});
		}

		if (beforeMessageId !== undefined) {
			const cursorMessage = await this.prisma.chatMessage.findFirst({
				where: {
					id: beforeMessageId,
					OR: [
						{ senderUUID: userUUID, recipientUUID: otherUserUUID },
						{ senderUUID: otherUserUUID, recipientUUID: userUUID },
					],
				},
				select: { id: true },
			});
			if (!cursorMessage) {
				throw new WsException({ code: "CHAT_INVALID_CURSOR", message: "Invalid history cursor" });
			}
		}

		const rows = await this.prisma.chatMessage.findMany({
			where: {
				OR: [
					{ senderUUID: userUUID, recipientUUID: otherUserUUID },
					{ senderUUID: otherUserUUID, recipientUUID: userUUID },
				],
			},
			orderBy: [{ createdAt: "desc" }, { id: "desc" }],
			take: limit + 1,
			...(beforeMessageId === undefined
				? {}
				: { cursor: { id: beforeMessageId }, skip: 1 }),
			select: {
				id: true,
				senderUUID: true,
				recipientUUID: true,
				content: true,
				createdAt: true,
			},
		});

		const hasMore = rows.length > limit;
		const page = rows.slice(0, limit);
		return {
			messages: page.reverse(),
			nextCursor: hasMore
				? page[page.length - 1]?.id ?? null
				: null,
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
