import { createStore, reconcile } from "solid-js/store";
import { presenceListSchema, presenceSchema } from "@flex/shared";
import { socket } from "~/api/socket";

const [onlineByUuid, setOnlineByUuid] = createStore<Record<string, boolean>>({});

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

socket.on("disconnect", () => setOnlineByUuid(reconcile({})));

export const presenceOf = (userUuid: string): boolean | undefined => onlineByUuid[userUuid];
