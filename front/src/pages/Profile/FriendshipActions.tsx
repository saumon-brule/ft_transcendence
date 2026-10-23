import { createMemo, Match, Switch } from "solid-js";
import { appContract } from "@flex/shared";
import { type ClientInferResponses } from "@ts-rest/core";
import { queryClient } from "~/App";
import { client, queryKeys } from "~/api/client";
import { useMeProfileQuery } from "~/api/queryHooks/meProfile";
import Button from "~/components/inputs/Button";
import { summonErrorToast } from "~/components/ui/Toaster";

type FriendshipStatus = "loading" | "friends" | "incoming" | "outgoing" | "none";
type ShortUser = { uuid: string; username: string };
type MeResponse = ClientInferResponses<typeof appContract.users.me, 200>;
type UserResponse = ClientInferResponses<typeof appContract.users.getUser, 200>;
type RelationResponse = ClientInferResponses<typeof appContract.friends.isFriendWith, 200>;

type FriendshipActionsProps = {
	meUuid: string;
	targetUuid: string;
};

export default function FriendshipActions(props: FriendshipActionsProps) {
	const me = useMeProfileQuery();
	const relation = client.friends.isFriendWith.createQuery(
		() => queryKeys.friends.isFriendWith([props.targetUuid]),
		{ query: { get userUuid1() { return props.meUuid; }, get userUuid2() { return props.targetUuid; } } },
	);

	const makeRequestMutation = client.friends.makeRequest.createMutation();
	const removeFriendMutation = client.friends.removeFriend.createMutation();
	const manageRequestMutation = client.friends.manageRequests.createMutation();

	const status = createMemo<FriendshipStatus>(() => {
		if (!me.data || !relation.data) return "loading";
		if (me.data.body.friends.some((f) => f.uuid === props.targetUuid)) return "friends";
		if (me.data.body.friendRequests.some((f) => f.uuid === props.targetUuid)) return "incoming";
		if (relation.data.body.isFriend === "PENDING") return "outgoing";
		return "none";
	});

	const pending = () => makeRequestMutation.isPending
		|| removeFriendMutation.isPending
		|| manageRequestMutation.isPending;

	function setRelation(isFriend: RelationResponse["body"]["isFriend"]) {
		queryClient.setQueryData<RelationResponse>(
			queryKeys.friends.isFriendWith([props.targetUuid]),
			(old) => old && { ...old, body: { isFriend } },
		);
	}

	function updateMe(update: (body: MeResponse["body"]) => Partial<MeResponse["body"]>) {
		queryClient.setQueryData<MeResponse>(
			queryKeys.users.me(),
			(old) => old && { ...old, body: { ...old.body, ...update(old.body) } },
		);
	}

	function updateTargetFriends(update: (friends: ShortUser[]) => ShortUser[]) {
		const targetUuid = props.targetUuid;
		queryClient.setQueryData<UserResponse>(
			queryKeys.users.getUser([targetUuid]),
			(old) => old && { ...old, body: { ...old.body, friends: update(old.body.friends) } },
		);
	}

	function sendRequest() {
		makeRequestMutation.mutate(
			{ body: { targetUuid: props.targetUuid } },
			{
				onSuccess: () => setRelation("PENDING"),
				onError: () => summonErrorToast("Failed to send friend request"),
			},
		);
	}

	function removeFriend() {
		removeFriendMutation.mutate(
			{ params: { friendUuid: props.targetUuid } },
			{
				onSuccess: () => {
					setRelation("NO");
					updateMe((body) => ({ friends: body.friends.filter((f) => f.uuid !== props.targetUuid) }));
					updateTargetFriends((friends) => friends.filter((f) => f.uuid !== props.meUuid));
				},
				onError: () => summonErrorToast("Failed to remove friend"),
			},
		);
	}

	function answerRequest(answer: "ACCEPTED" | "DENIED") {
		manageRequestMutation.mutate(
			{ params: { requesterUuid: props.targetUuid }, body: { status: answer } },
			{
				onSuccess: () => {
					setRelation(answer === "ACCEPTED" ? "YES" : "NO");

					if (answer === "DENIED") return;

					const requester = me.data?.body.friendRequests.find((f) => f.uuid === props.targetUuid);
					updateMe((body) => ({
						friendRequests: body.friendRequests.filter((f) => f.uuid !== props.targetUuid),
						friends: requester ? [...body.friends, requester] : body.friends,
					}));
					if (me.data) {
						updateTargetFriends((friends) => [...friends, { uuid: me.data.body.uuid, username: me.data.body.username }]);
					}
				},
				onError: () => summonErrorToast("Failed to answer friend request"),
			},
		);
	}

	return <div class="friendship-actions">
		<Switch>
			<Match when={status() === "none"}>
				<Button type="button" onClick={sendRequest} disabled={pending()}>Request friend</Button>
			</Match>
			<Match when={status() === "outgoing"}>
				<div class="friendship-status outgoing">Friend request sent</div>
			</Match>
			<Match when={status() === "incoming"}>
				<div class="friendship-status incoming">Sent you a friend request</div>
				<div class="friendship-buttons">
					<Button type="button" onClick={() => answerRequest("ACCEPTED")} disabled={pending()} variant="text" size="sm">Accept</Button>
					<Button type="button" onClick={() => answerRequest("DENIED")} disabled={pending()} variant="danger" size="sm">Decline</Button>
				</div>
			</Match>
			<Match when={status() === "friends"}>
				<div class="friendship-status friends">Friends</div>
				<Button type="button" onClick={removeFriend} disabled={pending()} variant="text" size="sm">Remove friend</Button>
			</Match>
		</Switch>
	</div>;
}
