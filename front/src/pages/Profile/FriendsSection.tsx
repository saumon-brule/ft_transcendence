import { For, Show } from "solid-js";
import { env } from "~/env";
import { PresenceAvatar } from "~/components/ui/PresenceDot/PresenceDot";
import type { User } from "@flex/shared";
import { A } from "@solidjs/router";
import { useTranslation } from "~/i18n/context";

type FriendsSectionProps = { friends: User["friends"] };

export default function FriendsSection(props: FriendsSectionProps) {
	const { t } = useTranslation();
	return <Show when={props.friends.length > 0}>
		<section class="friends">
			<h3>{t("pages.profile.friends")}</h3>
			<div class="friends-list">
				<For each={props.friends}>{(friend) => <A class="friend-card" href={`/user/${friend.uuid}`}>
					<PresenceAvatar uuid={friend.uuid} status={friend.status}>
						<img src={`${env.VITE_API_URL}/users/${friend.uuid}/avatar`} alt={t("pages.profile.userPicture", { username: friend.username })} />
					</PresenceAvatar>
					<span>{friend.username}</span>
				</A>}</For>
			</div>
		</section>
	</Show>;
}
