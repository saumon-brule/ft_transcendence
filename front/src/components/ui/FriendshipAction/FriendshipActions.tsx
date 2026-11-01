import { createMemo, Match, Switch } from "solid-js";
import { serverContract, type FriendRelation, type FriendRequestAnswer, type ShortUser } from "@flex/shared";
import { type ClientInferResponses } from "@ts-rest/core";
import { queryClient } from "~/App";
import { client, queryKeys } from "~/api/client";
import { useMeProfileQuery } from "~/api/queryHooks/meProfile";
import Button from "~/components/inputs/Button";
import { summonErrorToast } from "~/components/ui/Toaster";
import { UserRoundX } from "lucide-solid";
import "./FriendshipActions.scss";

type FriendshipStatus = "loading" | "friends" | "incoming" | "outgoing" | "none";
type MeResponse = ClientInferResponses<typeof serverContract.users.me, 200>;
type UserResponse = ClientInferResponses<typeof serverContract.users.getUser, 200>;
type RelationResponse = ClientInferResponses<typeof serverContract.friends.isFriendWith, 200>;

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

	function setRelation(targetUuid: string, isFriend: FriendRelation) {
		queryClient.setQueryData<RelationResponse>(
			queryKeys.friends.isFriendWith([targetUuid]),
			(old) => old && { ...old, body: { isFriend } },
		);
	}

	function updateMe(update: (body: MeResponse["body"]) => Partial<MeResponse["body"]>) {
		queryClient.setQueryData<MeResponse>(
			queryKeys.users.me(),
			(old) => old && { ...old, body: { ...old.body, ...update(old.body) } },
		);
	}

	function updateTargetFriends(targetUuid: string, update: (friends: ShortUser[]) => ShortUser[]) {
		queryClient.setQueryData<UserResponse>(
			queryKeys.users.getUser([targetUuid]),
			(old) => old && { ...old, body: { ...old.body, friends: update(old.body.friends) } },
		);
	}

	function sendRequest() {
		const targetUuid = props.targetUuid;
		makeRequestMutation.mutate(
			{ body: { targetUuid } },
			{
				onSuccess: () => setRelation(targetUuid, "PENDING"),
				onError: () => summonErrorToast(() => "Failed to send friend request"),
			},
		);
	}

	function removeFriend() {
		const targetUuid = props.targetUuid;
		const meUuid = props.meUuid;
		removeFriendMutation.mutate(
			{ params: { friendUuid: targetUuid } },
			{
				onSuccess: () => {
					setRelation(targetUuid, "NO");
					updateMe((body) => ({ friends: body.friends.filter((f) => f.uuid !== targetUuid) }));
					updateTargetFriends(targetUuid, (friends) => friends.filter((f) => f.uuid !== meUuid));
				},
				onError: () => summonErrorToast(() => "Failed to remove friend"),
			},
		);
	}

	function answerRequest(answer: FriendRequestAnswer) {
		const targetUuid = props.targetUuid;
		manageRequestMutation.mutate(
			{ params: { requesterUuid: targetUuid }, body: { status: answer } },
			{
				onSuccess: () => {
					setRelation(targetUuid, answer === "ACCEPTED" ? "YES" : "NO");

					if (answer === "DENIED") return;

					const requester = me.data?.body.friendRequests.find((f) => f.uuid === targetUuid);
					updateMe((body) => ({
						friendRequests: body.friendRequests.filter((f) => f.uuid !== targetUuid),
						friends: requester ? [...body.friends, requester] : body.friends,
					}));
					if (me.data) {
						updateTargetFriends(targetUuid, (friends) => [...friends, { uuid: me.data.body.uuid, username: me.data.body.username }]);
					}
				},
				onError: () => summonErrorToast(() => "Failed to answer friend request"),
			},
		);
	}

	return <div class={`friendship-actions friendship-actions--status--${status()}`}>
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
				<Button icon type="button" onClick={removeFriend} disabled={pending()} variant="danger" size="sm"><UserRoundX/></Button>
			</Match>
		</Switch>
	</div>;
}
