import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayInit, SubscribeMessage, WebSocketGateway } from "@nestjs/websockets";
import { authRefreshSchema, type AuthRefreshResult } from "@flex/shared";
import { SocketAuthService } from "../auth/auth-socket.service";
import { env } from "../core/env";
import { RealtimeService, userRoom } from "./realtime.service";
import type { RealtimeServer, RealtimeSocket } from "./realtime.types";

@WebSocketGateway({
	cors: {
		origin: env.BASE_FRONT_URL,
		credentials: true,
	},
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection {
	private readonly expiryTimers = new Map<string, NodeJS.Timeout>();

	constructor(
		private readonly socketAuthService: SocketAuthService,
		private readonly realtimeService: RealtimeService,
	) {}

	afterInit(server: RealtimeServer): void {
		this.realtimeService.attach(server);

		server.use((socket, next) => {
			void this.socketAuthService.authenticate(socket.handshake.auth?.token)
				.then(({ userUUID, expiresAt }) => {
					socket.data.userUUID = userUUID;
					void socket.join(userRoom(userUUID));
					this.scheduleExpiry(socket, expiresAt);
					socket.once("disconnect", () => this.clearExpiry(socket.id));
					next();
				})
				.catch(() => next(new Error("Unauthorized")));
		});
	}

	handleConnection(client: RealtimeSocket): void {
		if (typeof client.data.userUUID !== "string") {
			client.disconnect(true);
		}
	}

	@SubscribeMessage("auth:refresh")
	async refreshToken(
		@MessageBody() payload: unknown,
		@ConnectedSocket() client: RealtimeSocket,
	): Promise<AuthRefreshResult> {
		const parsed = authRefreshSchema.safeParse(payload);
		if (!parsed.success) return { ok: false };

		try {
			const { userUUID, expiresAt } = await this.socketAuthService.authenticate(parsed.data.token);
			if (userUUID !== client.data.userUUID) return { ok: false };

			this.scheduleExpiry(client, expiresAt);
			return { ok: true };
		} catch {
			return { ok: false };
		}
	}

	private scheduleExpiry(socket: RealtimeSocket, expiresAt: number | null): void {
		this.clearExpiry(socket.id);
		if (expiresAt === null) return;

		this.expiryTimers.set(
			socket.id,
			setTimeout(() => socket.disconnect(true), Math.max(expiresAt - Date.now(), 0)),
		);
	}

	private clearExpiry(socketId: string): void {
		clearTimeout(this.expiryTimers.get(socketId));
		this.expiryTimers.delete(socketId);
	}
}
