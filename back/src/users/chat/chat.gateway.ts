import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayInit,
	SubscribeMessage,
	WebSocketGateway,
	WsException,
} from "@nestjs/websockets";
import { type DefaultEventsMap, type Server, type Socket } from "socket.io";
import { z } from "zod";
import { SocketAuthService } from "../../auth/auth-socket.service";
import { env } from "../../core/env";
import { ChatService } from "./chat.service";

type ChatSocketData = {
	userUUID?: string;
};

type ChatSocket = Socket<
	DefaultEventsMap,
	DefaultEventsMap,
	DefaultEventsMap,
	ChatSocketData
>;

type ChatServer = Server<
	DefaultEventsMap,
	DefaultEventsMap,
	DefaultEventsMap,
	ChatSocketData
>;

const sendMessageSchema = z.object({
	recipientUUID: z.string().uuid(),
	content: z.string()
		.trim()
		.min(1)
		.max(256),
});

const historyRequestSchema = z.object({
	otherUserUUID: z.string().uuid(),
	beforeMessageId: z.number()
		.int()
		.positive()
		.optional(),
	limit: z.number()
		.int()
		.positive()
		.max(100)
		.optional(),
});

@WebSocketGateway({
	cors: {
		origin: env.BASE_FRONT_URL,
		credentials: true,
	},
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection {
	private server!: ChatServer;

	constructor(
		private readonly socketAuthService: SocketAuthService,
		private readonly chatService: ChatService,
	) {}

	afterInit(server: ChatServer): void {
		this.server = server;
		server.use((socket, next) => {
			void this.socketAuthService.authenticate(socket.handshake.auth?.token)
				.then(({ userUUID }) => {
					socket.data.userUUID = userUUID;
					next();
				})
				.catch(() => next(new Error("Unauthorized")));
		});
	}

	async handleConnection(client: ChatSocket): Promise<void> {
		const userUUID = client.data.userUUID;
		if (typeof userUUID !== "string") {
			client.disconnect(true);
			return;
		}

		await client.join(this.userRoom(userUUID));
	}

	@SubscribeMessage("chat:send")
	async sendMessage(
		@MessageBody() payload: unknown,
		@ConnectedSocket() client: ChatSocket,
	): Promise<void> {
		const parsed = sendMessageSchema.safeParse(payload);
		if (!parsed.success) {
			this.emitError(client, "chat:send", {
				code: "CHAT_INVALID_PAYLOAD",
				message: "Invalid message payload",
			});
			return;
		}

		const senderUUID = client.data.userUUID;
		if (typeof senderUUID !== "string") {
			client.disconnect(true);
			return;
		}

		try {
			const message = await this.chatService.sendMessage(
				senderUUID,
				parsed.data.recipientUUID,
				parsed.data.content,
			);
			this.server.to(this.userRoom(senderUUID)).emit("chat:message", message);
			this.server.to(this.userRoom(parsed.data.recipientUUID)).emit("chat:message", message);
		} catch (error) {
			if (!(error instanceof WsException)) {
				throw error;
			}
			this.emitError(client, "chat:send", error.getError());
		}
	}

	@SubscribeMessage("chat:history")
	async getHistory(
		@MessageBody() payload: unknown,
		@ConnectedSocket() client: ChatSocket,
	): Promise<void> {
		const parsed = historyRequestSchema.safeParse(payload);
		if (!parsed.success) {
			this.emitError(client, "chat:history", {
				code: "CHAT_INVALID_PAYLOAD",
				message: "Invalid history request",
			});
			return;
		}

		const userUUID = client.data.userUUID;
		if (typeof userUUID !== "string") {
			client.disconnect(true);
			return;
		}

		try {
			const history = await this.chatService.getHistory(
				userUUID,
				parsed.data.otherUserUUID,
				parsed.data.beforeMessageId,
				parsed.data.limit,
			);
			client.emit("chat:history:result", {
				otherUserUUID: parsed.data.otherUserUUID,
				...history,
			});
		} catch (error) {
			if (!(error instanceof WsException)) {
				throw error;
			}
			this.emitError(client, "chat:history", error.getError());
		}
	}

	private emitError(client: ChatSocket, event: string, error: unknown): void {
		client.emit("chat:error", { event, error });
	}

	private userRoom(userUUID: string): string {
		return `user:${userUUID}`;
	}
}
