import { useParams, useNavigate, A } from "@solidjs/router";
import { createEffect, For, Show, createMemo } from "solid-js";
import { summonErrorToast } from "~/components/ui/feedback/Toaster";
import "./Friends.scss";
import { useProfile } from "~/components/guards/ProfileGate";
import FriendshipActions from "~/components/ui/elements/FriendshipAction/FriendshipActions";
import { env } from "~/env";
import { CHAT_MAX_MESSAGE_LENGTH } from "@flex/shared";
import Button from "~/components/inputs/Button";
import Form from "~/components/inputs/Form/Form";
import TextInput from "~/components/inputs/TextInput";
import { SendHorizontalIcon, ArrowLeft } from "lucide-solid";
import { PresenceAvatar } from "~/components/ui/elements/PresenceDot/PresenceDot";
import { endChat, hasUnreadMessages, markAsRead, openChat, sendMessage as sendChatMessage, setDraft } from "~/store/messages.store";
import { isOnline } from "~/store/presence.store";
import { useSocketContext } from "~/api/socket.context";
import { useTranslation } from "~/i18n/context";

export default function Friends() {
	const { t } = useTranslation();
	const { socket } = useSocketContext();
	const navigate = useNavigate();
	const params = useParams<{ uuid?: string }>();
	const me = useProfile();
	const friend = createMemo(() => {
		if (params.uuid) {
			const info = me().friends.find((friend) => friend.uuid === params.uuid) ?? null;
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
		if (!params.uuid) {
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
			summonErrorToast(() => t("pages.friends.notFriends"));
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

		sendChatMessage(socket, f.info.uuid, f.chat.draft);
		setDraft(f.info.uuid, "");
	}

	return <div class="page" id="friends">
		<div class="friends-left" classList={{ "no-friend-list": !!friend() }}>
			<Show when={me().friendRequests.length > 0}>
				<section>
					<h2>{t("pages.friends.pending")}</h2>
					<div class="friend-list">
						<For each={me().friendRequests}>{(friend) => <div class="friend-card">
							<div class="friend-info">
								<img class="friend-avatar" src={`${env.VITE_API_URL}/users/${friend.uuid}/avatar`} alt={t("pages.friends.avatar", { username: friend.username })} />
								<A href={`/user/${friend.uuid}`} class="white-variant">{friend.username}</A>
							</div>
							<div class="friend-actions">
								<FriendshipActions meUuid={me().uuid} targetUuid={friend.uuid} />
							</div>
						</div>}</For>
					</div>
				</section>
			</Show>
			<section>
				<h2>{t("pages.friends.title")}</h2>
				<div class="friend-list">
					<For each={me().friends}>{(friend) => <div class="friend-card chat-link" classList={{ active: params.uuid === friend.uuid }}>
						<A class="friend-card-link" href={`/friends/${friend.uuid}`} aria-label={t("pages.friends.chatWith", { username: friend.username })} />
						<div class="friend-info">
							<PresenceAvatar uuid={friend.uuid} status={friend.status}>
								<img class="friend-avatar" src={`${env.VITE_API_URL}/users/${friend.uuid}/avatar`} alt={t("pages.friends.avatar", { username: friend.username })} />
							</PresenceAvatar>
							<span class="friend-name">{friend.username}</span>
							<Show when={hasUnreadMessages(friend.uuid)}><span class="unread-dot" role="img" aria-label={t("pages.friends.unread")} /></Show>
						</div>
						<div class="friend-actions">
							<FriendshipActions meUuid={me().uuid} targetUuid={friend.uuid} />
						</div>
					</div>}</For>
				</div>
			</section>
		</div>
		<div class="friends-right" classList={{ "no-chat-box": !friend() }}>
			<div class="back">
				<A href="/friends" class="white-variant"><ArrowLeft /> {t("pages.friends.back")}</A>
			</div>
			<div class="chat">
				<Show when={friend()} keyed>{(friend) => <>
					<div class="chat-header">
						<PresenceAvatar uuid={friend.info.uuid} status={friend.info.status}>
							<img class="friend-avatar" src={`${env.VITE_API_URL}/users/${friend.info.uuid}/avatar`} alt={t("pages.friends.avatar", { username: friend.info.username })} />
						</PresenceAvatar>
						<A href={`/user/${friend.info.uuid}`} class="white-variant friend-username">{friend.info.username}</A>
					</div>
					<div class="chat-messages">
						<div class="chat-messages-inner">
							<Show when={friend.chat.messages.length === 0}>
								<div class="chat-message-info"><span>{t("pages.friends.chat.noMessages")}</span></div>
							</Show>
							<For each={friend.chat.messages}>{(message) => <div class="chat-message" classList={{ "chat-message-info": message.type === "info", "from-me": message.author === "me" && message.type === "message", "from-friend": message.author === "friend" && message.type === "message" }}><span class="message-content">{message.content}</span></div>}
							</For>
						</div>
					</div>
					<div class="chat-input">
						<Form onSubmit={(e) => sendMessage(e)}>
							<TextInput value={friend.chat.draft} onInput={(e) => setDraft(friend.info.uuid, e.currentTarget.value)} type="text" maxlength={CHAT_MAX_MESSAGE_LENGTH} disabled={!isOnline(friend.info.uuid, friend.info.status)} placeholder={isOnline(friend.info.uuid, friend.info.status) ? t("pages.friends.chat.placeholder") : t("pages.friends.chat.offline", { username: friend.info.username })} />
							<Button disabled={friend.chat.draft.trim() === "" || !isOnline(friend.info.uuid, friend.info.status)} type="submit"><SendHorizontalIcon /></Button>
						</Form>
					</div>
				</>}</Show>
				<Show when={!friend()}>
					<div class="no-chat">
						<h2>{t("pages.friends.chat.select")}</h2>
					</div>
				</Show>
			</div>
		</div>
	</div>;
}
