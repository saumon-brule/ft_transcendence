import { A } from "@solidjs/router";
import type { ShortUser } from "@flex/shared";
import { env } from "~/env";
import "./UserCard.scss";

export default function UserCard(props: { user: ShortUser }) {
	return <A class="user-card" href={`/user/${props.user.uuid}`}>
		<img class="user-card-avatar" src={`${env.VITE_API_URL}/users/${props.user.uuid}/avatar`} alt="" />
		<span class="user-card-name">{props.user.username}</span>
	</A>;
}
