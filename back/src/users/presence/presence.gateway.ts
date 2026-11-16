import { Logger } from "@nestjs/common";
import {
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
	WebSocketGateway,
} from "@nestjs/websockets";
import { presenceListSchema, presenceSchema } from "@flex/shared";
import { env } from "../../core/env";
import { FriendsService } from "../friends/friends.service";
import { PresenceService } from "./presence.service";
import { type DefaultEventsMap, type Server, type Socket } from "socket.io";
import { SocketAuthService } from "../../auth/auth-socket.service";

type PresenceSocketData = {
	userUUID?: string;
};

type PresenceSocket = Socket<
	DefaultEventsMap,
	DefaultEventsMap,
	DefaultEventsMap,
	PresenceSocketData
>;

type PresenceServer = Server<
	DefaultEventsMap,
	DefaultEventsMap,
	DefaultEventsMap,
	PresenceSocketData
>;

@WebSocketGateway({
	cors: {
		origin: env.BASE_FRONT_URL,
		credentials: true,
	},
})
export class PresenceGateway implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect {
	private server!: PresenceServer;
	private readonly logger = new Logger(PresenceGateway.name);

	constructor(
		private readonly socketAuthService: SocketAuthService,
		private readonly friendsService: FriendsService,
		private readonly presenceService: PresenceService,
	) {}

	afterInit(server: PresenceServer): void {
		this.server = server;

		server.use((socket, next) => {
			void this.socketAuthService.authenticate(socket.handshake.auth?.token)
				.then((result) => {
					socket.data.userUUID = result.userUUID;
					next();
				})
				.catch(() => next(new Error("Unauthorized")));
		});
	}

	async handleConnection(client: PresenceSocket): Promise<void> {
		const userUUID = client.data.userUUID;
		if (typeof userUUID !== "string") {
			client.disconnect(true);
			return;
		}

		try {
			const friends = await this.friendsService.getFriends(userUUID);
			if (!client.connected) return;

			await client.join(this.userRoom(userUUID));
			if (!client.connected) return;

			const becameOnline = this.presenceService.connect(userUUID, client.id);

			const snapshot = presenceListSchema.parse(
				friends.map((friend) => ({
					...friend,
					online: this.presenceService.isOnline(friend.uuid),
				})),
			);

			client.emit("presence:snapshot", snapshot);

			if (becameOnline) {
				this.notifyFriends(friends, userUUID, true);
			}
		} catch (error) {
			this.logger.error(`Presence connection failed for ${userUUID}`, error);
			client.disconnect(true);
		}
	}

	async handleDisconnect(client: PresenceSocket): Promise<void> {
		const userUUID = client.data.userUUID;
		if (typeof userUUID !== "string") {
			return;
		}

		const becameOffline = this.presenceService.disconnect(userUUID, client.id);
		if (!becameOffline) {
			return;
		}

		try {
			const friends = await this.friendsService.getFriends(userUUID);
			if (this.presenceService.isOnline(userUUID)) {
				return;
			}
			this.notifyFriends(friends, userUUID, false);
		} catch (error) {
			this.logger.error(`Presence disconnection failed for ${userUUID}`, error);
		}
	}

	private notifyFriends(
		friends: Array<{ uuid: string }>,
		userUUID: string,
		online: boolean,
	): void {
		for (const friend of friends) {
			this.server.to(this.userRoom(friend.uuid)).emit(
				"presence:changed",
				presenceSchema.parse({ uuid: userUUID, online }),
			);
		}
	}

	private userRoom(userUUID: string): string {
		return `user:${userUUID}`;
	}
}
