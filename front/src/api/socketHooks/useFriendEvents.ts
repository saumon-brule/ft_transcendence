import { produce } from "solid-js/store";
import {
	friendRemovedSchema,
	friendRequestAcceptedSchema,
	friendRequestDeniedSchema,
	friendRequestReceivedSchema,
} from "@flex/shared";
import type { AppSocket } from "~/api/socket";
import { getMeShortUser, setRelation, updateMe, updateTargetFriends } from "~/api/queryHooks/friendsCache";
import { summonInfoToast } from "~/components/ui/feedback/Toaster";
import { endChat } from "~/store/messages.store";
import { setOnlineByUuid } from "~/store/presence.store";
import { t } from "~/i18n/context";

export function useFriendEvents(socket: AppSocket) {
	socket.on("friend:request-received", (payload) => {
		const sender = friendRequestReceivedSchema.safeParse(payload);
		if (!sender.success) return;

		updateMe((body) => ({
			friendRequests: body.friendRequests.some((request) => request.uuid === sender.data.uuid)
				? body.friendRequests
				: [...body.friendRequests, sender.data],
		}));
	});

	socket.on("friend:request-accepted", (payload) => {
		const parsed = friendRequestAcceptedSchema.safeParse(payload);
		if (!parsed.success) return;

		const { online, ...friend } = parsed.data;
		const me = getMeShortUser();

		setOnlineByUuid(friend.uuid, online);
		setRelation(friend.uuid, "YES");
		updateMe((body) => ({
			friendRequests: body.friendRequests.filter((request) => request.uuid !== friend.uuid),
			friends: body.friends.some((existing) => existing.uuid === friend.uuid)
				? body.friends
				: [...body.friends, { ...friend, status: online ? "online" as const : "offline" as const }],
		}));
		if (me) {
			updateTargetFriends(friend.uuid, (friends) => friends.some((existing) => existing.uuid === me.uuid)
				? friends
				: [...friends, me]);
		}
	});

	socket.on("friend:request-denied", (payload) => {
		const parsed = friendRequestDeniedSchema.safeParse(payload);
		if (!parsed.success) return;

		setRelation(parsed.data.uuid, "NO");
		summonInfoToast(() => t("toasts.friends.requestDeclined", { username: parsed.data.username }));
	});

	socket.on("friend:removed", (payload) => {
		const parsed = friendRemovedSchema.safeParse(payload);
		if (!parsed.success) return;

		const { uuid } = parsed.data;
		const me = getMeShortUser();

		setRelation(uuid, "NO");
		updateMe((body) => ({ friends: body.friends.filter((friend) => friend.uuid !== uuid) }));
		if (me) updateTargetFriends(uuid, (friends) => friends.filter((friend) => friend.uuid !== me.uuid));
		setOnlineByUuid(produce((online) => {
			delete online[uuid];
		}));
		endChat(uuid);
	});
}
