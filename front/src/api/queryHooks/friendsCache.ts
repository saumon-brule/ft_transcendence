import { serverContract, type FriendRelation, type ShortUser } from "@flex/shared";
import { type ClientInferResponses } from "@ts-rest/core";
import { queryClient } from "~/api/queryClient";
import { queryKeys } from "~/api/client";

type MeResponse = ClientInferResponses<typeof serverContract.users.me, 200>;
type UserResponse = ClientInferResponses<typeof serverContract.users.getUser, 200>;
type RelationResponse = ClientInferResponses<typeof serverContract.friends.isFriendWith, 200>;

export function setRelation(targetUuid: string, isFriend: FriendRelation) {
	queryClient.setQueryData<RelationResponse>(
		queryKeys.friends.isFriendWith([targetUuid]),
		(old) => old && { ...old, body: { isFriend } },
	);
}

export function updateMe(update: (body: MeResponse["body"]) => Partial<MeResponse["body"]>) {
	queryClient.setQueryData<MeResponse>(
		queryKeys.users.me(),
		(old) => old && { ...old, body: { ...old.body, ...update(old.body) } },
	);
}

export function updateTargetFriends(targetUuid: string, update: (friends: ShortUser[]) => ShortUser[]) {
	queryClient.setQueryData<UserResponse>(
		queryKeys.users.getUser([targetUuid]),
		(old) => old && { ...old, body: { ...old.body, friends: update(old.body.friends) } },
	);
}

export function getMeShortUser(): ShortUser | null {
	const me = queryClient.getQueryData<MeResponse>(queryKeys.users.me());
	return me
		? { uuid: me.body.uuid, username: me.body.username }
		: null;
}
