import { Injectable } from "@nestjs/common";

@Injectable()
export class PresenceService {
	private readonly connections = new Map<string, Set<string>>();

	public connect(userUUID: string, socketId: string): boolean {
		const sockets = this.connections.get(userUUID);

		if (sockets) {
			sockets.add(socketId);
			return false;
		}

		this.connections.set(userUUID, new Set([socketId]));
		return true;
	}

	public disconnect(userUUID: string, socketId: string): boolean {
		const sockets = this.connections.get(userUUID);
		if (!sockets || !sockets.delete(socketId)) {
			return false;
		}

		if (sockets.size > 0) {
			return false;
		}

		this.connections.delete(userUUID);
		return true;
	}

	public isOnline(userUUID: string): boolean {
		return (this.connections.get(userUUID)?.size ?? 0) > 0;
	}
}
