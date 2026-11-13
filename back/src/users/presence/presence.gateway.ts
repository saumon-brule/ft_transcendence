import { JwtService } from "@nestjs/jwt";
import {
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
	WebSocketGateway,
} from "@nestjs/websockets";
import { presenceListSchema, presenceSchema, type JwtPayload } from "@flex/shared";
import { env } from "../../core/env";
import { FriendsService } from "../friends/friends.service";
import { PresenceService } from "./presence.service";
import { type DefaultEventsMap, type Server, type Socket } from "socket.io";

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

	constructor(
		private readonly jwtService: JwtService,
		private readonly friendsService: FriendsService,
		private readonly presenceService: PresenceService,
	) {}

	afterInit(server: PresenceServer): void {
		this.server = server;

		server.use((socket, next) => {
			void this.authenticate(socket)
				.then(() => next())
				.catch(() => next(new Error("Unauthorized")));
		});
	}

	async handleConnection(client: PresenceSocket): Promise<void> {
		const userUUID = client.data.userUUID;
		if (typeof userUUID !== "string") {
			client.disconnect(true);
			return;
		}

		const friends = await this.friendsService.getFriends(userUUID);
		if(!client.connected) return;

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

		const friends = await this.friendsService.getFriends(userUUID);
		if (this.presenceService.isOnline(userUUID)) {
			return;
		}
		this.notifyFriends(friends, userUUID, false);
	}

	private async authenticate(socket: PresenceSocket): Promise<void> {
		const token: unknown = socket.handshake.auth?.token;
		if (typeof token !== "string" || token.length === 0) {
			throw new Error("Missing token");
		}

		const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
			secret: env.JWT_SECRET,
		});

		if (typeof payload.sub !== "string" || payload.emailVerified !== true) {
			throw new Error("Invalid token payload");
		}

		socket.data.userUUID = payload.sub;
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
