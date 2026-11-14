import { createStore, reconcile } from "solid-js/store";
import { presenceListSchema, presenceSchema, type OnlineStatus } from "@flex/shared";
import { socket, socketConnected } from "~/api/socket";

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

export function presenceOf(userUuid: string, fetchedStatus?: OnlineStatus): boolean | undefined {
	const known = userUuid in onlineByUuid;
	if (!known && fetchedStatus === undefined) return undefined;
	if (!socketConnected()) return false;
	return known
		? onlineByUuid[userUuid]
		: fetchedStatus === "online";
}

export const isOnline = (userUuid: string, fetchedStatus?: OnlineStatus): boolean => presenceOf(userUuid, fetchedStatus) === true;
