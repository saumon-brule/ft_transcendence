import { useParams, useNavigate, A } from "@solidjs/router";
import { createEffect, For, Show, createMemo, createSignal, on } from "solid-js";
import { summonErrorToast } from "~/components/ui/Toaster";
import { useUserProfileQuery } from "~/api/queryHooks/userProfile";
import "./Friends.scss";
import { useMeProfileQuery } from "~/api/queryHooks/meProfile";
import FriendshipActions from "~/components/ui/FriendshipAction/FriendshipActions";
import { env } from "~/env";
import Button from "~/components/inputs/Button";
import Form from "~/components/inputs/Form/Form";
import TextInput from "~/components/inputs/TextInput";
import { SendHorizontalIcon, ArrowLeft, MessagesCircle } from "lucide-solid";
import { addMessage, hasUnreadMessages, markAsRead, openChat, setDraft } from "~/store/messages.store";

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
			};;
		}
		return null;
	})

	// const profile = useUserProfileQuery(() => params.uuid);

	// createEffect(() => {
	//     if (profile.isError) {
	//         navigate("/home"); // !:! A remettre mais desact car chiant en dev
	//         summonErrorToast(() => "Unknown user");
	//     }
	// });

	createEffect(() => {
		if (params.uuid && !friend()) {
			navigate("/friends");
			summonErrorToast(() => "You are not friends with this user");
		}
	});

	createEffect(() => {
		if (friend() && friend()!.chat.isRead === false) {
			markAsRead(friend()!.info.uuid);
		}
	})

	function navigateChat(friendUuid: string) {
		navigate(`/friends/${friendUuid}`);
	}

	function sendMessage(e: SubmitEvent, friendUuid: string) {
		e.preventDefault();

		const f = friend();
		if (!f) return;

		addMessage(f.info.uuid, { author: "me", content: f.chat.draft, timestamp: new Date() });
		setDraft(f.info.uuid, "");

		setTimeout(() => {
			addMessage(f.info.uuid, { author: "friend", content: "COUCOU !", timestamp: new Date() });
		}, 1000);
	}

	return <div class="page" id="friends">
		<div class="friends-left">
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
						<For each={data.body.friends}>{(friend) => <div class="friend-card">
							<div class="friend-info">
								<img class="friend-avatar" src={`${env.VITE_API_URL}/users/${friend.uuid}/avatar`} alt={`${friend.username}'s avatar`} />
								<A href={`/user/${friend.uuid}`} class="white-variant">{friend.username}</A>
							</div>
							<div class="friend-actions">
								<Button icon size="sm" variant="text" onClick={() => navigateChat(friend.uuid)}>
									<span class="icon-badge" classList={{ notification: hasUnreadMessages(friend.uuid) }}>
										<MessagesCircle/>
									</span>
								</Button>
								<FriendshipActions meUuid={data.body.uuid} targetUuid={friend.uuid} />
							</div>
						</div>}</For>
					</div>
				</section>
			</>}</Show>
		</div>
		<div class="friends-right">
			<div class="back">
				<A href="/friends" class="white-variant"><ArrowLeft/> Back to friends list</A>
			</div>
			<div class="chat">
				<Show when={friend()} keyed>{(friend) => <>
					<div class="chat-header">
						<img class="friend-avatar" src={`${env.VITE_API_URL}/users/${friend.info.uuid}/avatar`} alt={`${friend.info.username}'s avatar`} />
						<span class="friend-username">{friend.info.username}</span>
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
						<Form onSubmit={(e) => sendMessage(e, friend.info.uuid)}>
							<TextInput value={friend.chat.draft} onInput={(e) => setDraft(friend.info.uuid, e.currentTarget.value)} type="text" placeholder="Type a message..."/>
							<Button disabled={friend.chat.draft === ""} type="submit"><SendHorizontalIcon/></Button>
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
