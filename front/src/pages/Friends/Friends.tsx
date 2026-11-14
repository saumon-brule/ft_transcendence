import { useParams, useNavigate, A } from "@solidjs/router";
import { createEffect, For, Show, createMemo } from "solid-js";
import { summonErrorToast } from "~/components/ui/Toaster";
import "./Friends.scss";
import { useMeProfileQuery } from "~/api/queryHooks/meProfile";
import FriendshipActions from "~/components/ui/FriendshipAction/FriendshipActions";
import { env } from "~/env";
import { CHAT_MAX_MESSAGE_LENGTH } from "@flex/shared";
import Button from "~/components/inputs/Button";
import Form from "~/components/inputs/Form/Form";
import TextInput from "~/components/inputs/TextInput";
import { SendHorizontalIcon, ArrowLeft } from "lucide-solid";
import { PresenceAvatar } from "~/components/ui/PresenceDot/PresenceDot";
import { endChat, hasUnreadMessages, markAsRead, openChat, sendMessage as sendChatMessage, setDraft } from "~/store/messages.store";
import { isOnline } from "~/store/presence.store";

export default function Friends() {
	const navigate = useNavigate();
	const params = useParams<{ uuid?: string }>();
	const profileQuery = useMeProfileQuery();
	const friend = createMemo(() => {
		if (params.uuid) {
			const info = profileQuery.data?.body.friends.find((friend) => friend.uuid === params.uuid) ?? null;
			if (!info) {
				return null;
			}
			return {
				info,
				chat: openChat(params.uuid),
			};
		}
		return null;
	});

	let openedFriendUuid: string | undefined;
	createEffect(() => {
		if (!profileQuery.data || !params.uuid) {
			openedFriendUuid = undefined;
			return;
		}

		if (friend()) {
			openedFriendUuid = params.uuid;
			return;
		}

		const removed = openedFriendUuid === params.uuid;
		openedFriendUuid = undefined;
		navigate("/friends");
		if (removed) {
			endChat(params.uuid);
		} else {
			summonErrorToast(() => "You are not friends with this user");
		}
	});

	createEffect(() => {
		if (friend() && friend()!.chat.isRead === false) {
			markAsRead(friend()!.info.uuid);
		}
	});

	function sendMessage(e: SubmitEvent) {
		e.preventDefault();

		const f = friend();
		if (!f || !isOnline(f.info.uuid, f.info.status) || f.chat.draft.trim() === "") return;

		sendChatMessage(f.info.uuid, f.chat.draft);
		setDraft(f.info.uuid, "");
	}

	return <div class="page" id="friends">
		<div class="friends-left" classList={{ "no-friend-list": !!friend() }}>
			<Show when={profileQuery.data} keyed>{(data) => <>
				<Show when={data.body.friendRequests.length > 0}>
					<section>
						<h2>Pending</h2>
						<div class="friend-list">
							<For each={data.body.friendRequests}>{(friend) => <div class="friend-card">
								<div class="friend-info">
									<img class="friend-avatar" src={`${env.VITE_API_URL}/users/${friend.uuid}/avatar`} alt={`${friend.username}'s avatar`} />
									<A href={`/user/${friend.uuid}`} class="white-variant">{friend.username}</A>
								</div>
								<div class="friend-actions">
									<FriendshipActions meUuid={data.body.uuid} targetUuid={friend.uuid} />
								</div>
							</div>}</For>
						</div>
					</section>
				</Show>
				<section>
					<h2>Friends</h2>
					<div class="friend-list">
						<For each={data.body.friends}>{(friend) => <div class="friend-card chat-link" classList={{ active: params.uuid === friend.uuid }}>
							<A class="friend-card-link" href={`/friends/${friend.uuid}`} aria-label={`Chat with ${friend.username}`} />
							<div class="friend-info">
								<PresenceAvatar uuid={friend.uuid} status={friend.status}>
									<img class="friend-avatar" src={`${env.VITE_API_URL}/users/${friend.uuid}/avatar`} alt={`${friend.username}'s avatar`} />
								</PresenceAvatar>
								<span class="friend-name">{friend.username}</span>
								<Show when={hasUnreadMessages(friend.uuid)}><span class="unread-dot" role="img" aria-label="Unread messages" /></Show>
							</div>
							<div class="friend-actions">
								<FriendshipActions meUuid={data.body.uuid} targetUuid={friend.uuid} />
							</div>
						</div>}</For>
					</div>
				</section>
			</>}</Show>
		</div>
		<div class="friends-right" classList={{ "no-chat-box": !friend() }}>
			<div class="back">
				<A href="/friends" class="white-variant"><ArrowLeft/> Back to friends list</A>
			</div>
			<div class="chat">
				<Show when={friend()} keyed>{(friend) => <>
					<div class="chat-header">
						<PresenceAvatar uuid={friend.info.uuid} status={friend.info.status}>
							<img class="friend-avatar" src={`${env.VITE_API_URL}/users/${friend.info.uuid}/avatar`} alt={`${friend.info.username}'s avatar`} />
						</PresenceAvatar>
						<A href={`/user/${friend.info.uuid}`} class="white-variant friend-username">{friend.info.username}</A>
					</div>
					<div class="chat-messages">
						<div class="chat-messages-inner">
							<Show when={friend.chat.messages.length === 0}>
								<div class="chat-message-info"><span>No messages yet</span></div>
							</Show>
							<For each={friend.chat.messages}>{(message) => <div class="chat-message" classList={{ "from-me": message.author === "me", "from-friend": message.author === "friend" }}>
								<span class="message-content">{message.content}</span>
							</div>}</For>
						</div>
					</div>
					<div class="chat-input">
						<Form onSubmit={(e) => sendMessage(e)}>
							<TextInput value={friend.chat.draft} onInput={(e) => setDraft(friend.info.uuid, e.currentTarget.value)} type="text" maxlength={CHAT_MAX_MESSAGE_LENGTH} disabled={!isOnline(friend.info.uuid, friend.info.status)} placeholder={isOnline(friend.info.uuid, friend.info.status) ? "Type a message..." : `${friend.info.username} is offline`}/>
							<Button disabled={friend.chat.draft.trim() === "" || !isOnline(friend.info.uuid, friend.info.status)} type="submit"><SendHorizontalIcon/></Button>
						</Form>
					</div>
				</>}</Show>
				<Show when={!friend()}>
					<div class="no-chat">
						<h2>Select an online friend to start chatting</h2>
					</div>
				</Show>
			</div>
		</div>
	</div>;
}
