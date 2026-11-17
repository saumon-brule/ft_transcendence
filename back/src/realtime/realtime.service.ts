import { Injectable, Logger } from "@nestjs/common";
import type { ServerToClientEvents } from "@flex/shared";
import type { RealtimeServer } from "./realtime.types";

export const userRoom = (userUUID: string) => `user:${userUUID}`;

@Injectable()
export class RealtimeService {
	private readonly logger = new Logger(RealtimeService.name);
	private server: RealtimeServer | null = null;

	public attach(server: RealtimeServer): void {
		this.server = server;
	}

	public emitToUser<E extends keyof ServerToClientEvents>(
		userUUID: string,
		event: E,
		...payload: Parameters<ServerToClientEvents[E]>
	): void {
		if (!this.server) {
			this.logger.warn(`"${event}" dropped: the websocket server is not ready`);
			return;
		}
		this.server.to(userRoom(userUUID)).emit(event, ...payload);
	}

	public emitToUsers<E extends keyof ServerToClientEvents>(
		userUUIDs: Iterable<string>,
		event: E,
		...payload: Parameters<ServerToClientEvents[E]>
	): void {
		for (const userUUID of new Set(userUUIDs)) {
			this.emitToUser(userUUID, event, ...payload);
		}
	}
}
