import { createMemo, Match, Switch } from "solid-js";
import { type FriendRequestAnswer } from "@flex/shared";
import { client, queryKeys } from "~/api/client";
import { useProfile } from "~/components/guards/ProfileGate";
import { setRelation, updateMe, updateTargetFriends } from "~/api/queryHooks/friendsCache";
import Button from "~/components/inputs/Button";
import { summonErrorToast } from "~/components/ui/feedback/Toaster";
import { UserRoundX } from "lucide-solid";
import "./FriendshipActions.scss";
import { useTranslation } from "~/i18n/context";

type FriendshipStatus = "loading" | "friends" | "incoming" | "outgoing" | "none";

type FriendshipActionsProps = {
	meUuid: string;
	targetUuid: string;
};

export default function FriendshipActions(props: FriendshipActionsProps) {
	const { t } = useTranslation();
	const me = useProfile();
	const relation = client.friends.isFriendWith.createQuery(
		() => queryKeys.friends.isFriendWith([props.targetUuid]),
		{ query: { get userUuid1() { return props.meUuid; }, get userUuid2() { return props.targetUuid; } } },
	);

	const makeRequestMutation = client.friends.makeRequest.createMutation();
	const removeFriendMutation = client.friends.removeFriend.createMutation();
	const manageRequestMutation = client.friends.manageRequests.createMutation();

	const status = createMemo<FriendshipStatus>(() => {
		if (!relation.data) return "loading";
		if (me().friends.some((f) => f.uuid === props.targetUuid)) return "friends";
		if (me().friendRequests.some((f) => f.uuid === props.targetUuid)) return "incoming";
		if (relation.data.body.isFriend === "PENDING") return "outgoing";
		return "none";
	});

	const pending = () => makeRequestMutation.isPending
		|| removeFriendMutation.isPending
		|| manageRequestMutation.isPending;

	function sendRequest() {
		const targetUuid = props.targetUuid;
		makeRequestMutation.mutate(
			{ body: { targetUuid } },
			{
				onSuccess: () => setRelation(targetUuid, "PENDING"),
				onError: () => summonErrorToast(() => t("components.friendshipActions.sendError")),
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
				onError: () => summonErrorToast(() => t("components.friendshipActions.removeError")),
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

					const requester = me().friendRequests.find((f) => f.uuid === targetUuid);
					updateMe((body) => ({
						friendRequests: body.friendRequests.filter((f) => f.uuid !== targetUuid),
						friends: requester ? [...body.friends, { ...requester, status: "offline" as const }] : body.friends,
					}));
					updateTargetFriends(targetUuid, (friends) => [...friends, { uuid: me().uuid, username: me().username }]);
				},
				onError: () => summonErrorToast(() => t("components.friendshipActions.answerError")),
			},
		);
	}

	return <div class={`friendship-actions friendship-actions--status--${status()}`}>
		<Switch>
			<Match when={status() === "none"}>
				<Button type="button" onClick={sendRequest} disabled={pending()}>{t("components.friendshipActions.request")}</Button>
			</Match>
			<Match when={status() === "outgoing"}>
				<div class="friendship-status outgoing">{t("components.friendshipActions.requestSent")}</div>
			</Match>
			<Match when={status() === "incoming"}>
				<div class="friendship-status incoming">{t("components.friendshipActions.requestReceived")}</div>
				<div class="friendship-buttons">
					<Button type="button" onClick={() => answerRequest("ACCEPTED")} disabled={pending()} variant="text" size="sm">{t("components.friendshipActions.accept")}</Button>
					<Button type="button" onClick={() => answerRequest("DENIED")} disabled={pending()} variant="danger" size="sm">{t("components.friendshipActions.decline")}</Button>
				</div>
			</Match>
			<Match when={status() === "friends"}>
				<div class="friendship-status friends">{t("components.friendshipActions.friends")}</div>
				<Button type="button" class="remove-friend" onClick={removeFriend} disabled={pending()} variant="danger" size="sm"><UserRoundX/></Button>
			</Match>
		</Switch>
	</div>;
}
