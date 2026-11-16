import { reconcile } from "solid-js/store";
import { presenceListSchema, presenceSchema } from "@flex/shared";
import type { AppSocket } from "~/api/socket";
import { setOnlineByUuid, setPresenceLive } from "~/store/presence.store";

export function usePresenceEvents(socket: AppSocket) {
	socket.on("presence:snapshot", (payload) => {
		const snapshot = presenceListSchema.safeParse(payload);
		if (snapshot.success) {
			setOnlineByUuid(reconcile(Object.fromEntries(snapshot.data.map((friend) => [friend.uuid, friend.online]))));
		}
	});

	socket.on("presence:changed", (payload) => {
		const change = presenceSchema.safeParse(payload);
		if (change.success) setOnlineByUuid(change.data.uuid, change.data.online);
	});

	setPresenceLive(socket.connected);
	socket.on("connect", () => setPresenceLive(true));
	socket.on("disconnect", () => {
		setPresenceLive(false);
		setOnlineByUuid(reconcile({}));
	});
}
