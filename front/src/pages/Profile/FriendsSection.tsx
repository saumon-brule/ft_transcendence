import { For } from "solid-js";
import { env } from "~/env";

const fakeFriends = [
	{ uuid: "2f7c3d9a-8e1b-4b5f-9c2d-1a6e7f8b9c01", username: "Machin" },
	{ uuid: "3a8d4e0b-9f2c-4c6a-ad3e-2b7f8a9c0d12", username: "Truc" },
	{ uuid: "4b9e5f1c-a03d-4d7b-be4f-3c8a9b0d1e23", username: "Fabrice" },
];

export default function FriendsSection() {
	return <section class="friends">
		<h3>Friends</h3>
		<div class="friends-list">
			<For each={fakeFriends}>{(friend) => <div class="friend-card">
				<img src={`${env.VITE_API_URL}/users/${friend.uuid}/avatar`} alt={`${friend.username} profile picture`} />
				<span>{friend.username}</span>
			</div>}</For>
		</div>
	</section>;
}
