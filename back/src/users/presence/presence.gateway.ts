import { JwtService } from "@nestjs/jwt";
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    WebSocketGateway,
} from "@nestjs/websockets";
import { type JwtPayload } from "@flex/shared";
import { type Server, type Socket } from "socket.io";
import { env } from "../../core/env";
import { FriendsService } from "../friends/friends.service";
import { PresenceService } from "./presence.service";

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
    private server!: Server;

    constructor(
        private readonly jwtService: JwtService,
        private readonly friendsService: FriendsService,
        private readonly presenceService: PresenceService,
    ) {}

    afterInit(server: Server): void {
        this.server = server;

        server.use((socket, next) => {
            void this.authenticate(socket)
                .then(() => next())
                .catch(() => next(new Error("Unauthorized")));
        });
    }

    async handleConnection(client: Socket): Promise<void> {
        const userUUID = client.data.userUUID;
        if (typeof userUUID !== "string") {
            client.disconnect(true);
            return;
        }

        const friends = await this.friendsService.getFriends(userUUID);

        await client.join(this.userRoom(userUUID));

        const becameOnline = this.presenceService.connect(userUUID, client.id);

        client.emit(
            "presence:snapshot",
            friends.map((friend) => ({
                ...friend,
                online: this.presenceService.isOnline(friend.uuid),
            })),
        );

        if (becameOnline) {
            this.notifyFriends(friends, userUUID, true);
        }
    }

    async handleDisconnect(client: Socket): Promise<void> {
        const userUUID = client.data.userUUID;
        if (typeof userUUID !== "string") {
            return;
        }

        const becameOffline = this.presenceService.disconnect(userUUID, client.id);
        if (!becameOffline) {
            return;
        }

        const friends = await this.friendsService.getFriends(userUUID);
        this.notifyFriends(friends, userUUID, false);
    }

    private async authenticate(socket: Socket): Promise<void> {
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
            this.server.to(this.userRoom(friend.uuid)).emit("presence:changed", {
                uuid: userUUID,
                online,
            });
        }
    }

    private userRoom(userUUID: string): string {
        return `user:${userUUID}`;
    }
}