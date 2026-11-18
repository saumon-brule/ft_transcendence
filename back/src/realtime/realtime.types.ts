import type { DefaultEventsMap, Server, Socket } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "@flex/shared";

export type SocketData = {
	userUUID?: string;
};

export type RealtimeServer = Server<ClientToServerEvents, ServerToClientEvents, DefaultEventsMap, SocketData>;
export type RealtimeSocket = Socket<ClientToServerEvents, ServerToClientEvents, DefaultEventsMap, SocketData>;
