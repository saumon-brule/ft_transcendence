import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { type OnlineStatus } from "@flex/shared";

export const [onlineByUuid, setOnlineByUuid] = createStore<Record<string, boolean>>({});

export const [presenceLive, setPresenceLive] = createSignal(false);

export function presenceOf(userUuid: string, fetchedStatus?: OnlineStatus): boolean | undefined {
	const known = userUuid in onlineByUuid;
	if (!known && fetchedStatus === undefined) return undefined;
	if (!presenceLive()) return false;
	return known
		? onlineByUuid[userUuid]
		: fetchedStatus === "online";
}

export const isOnline = (userUuid: string, fetchedStatus?: OnlineStatus): boolean => presenceOf(userUuid, fetchedStatus) === true;
