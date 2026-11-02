import { For } from "solid-js";
import { env } from "~/env";
import type { User } from "@flex/shared";
import { A } from "@solidjs/router";

type FriendsSectionProps = { friends: User["friends"] };

export default function FriendsSection(props: FriendsSectionProps) {
	return <section class="friends">
		<h3>Friends</h3>
		<div class="friends-list">
			<For each={props.friends}>{(friend) => <A class="friend-card" href={`/user/${friend.uuid}`}>
				<img src={`${env.VITE_API_URL}/users/${friend.uuid}/avatar`} alt={`${friend.username} profile picture`} />
				<span>{friend.username}</span>
			</A>}</For>
		</div>
	</section>;
}
