import { Show } from "solid-js";
import type { User } from "@flex/shared";
import MusicBars from "~/components/graphics/icons/MusicBars";
import { env } from "~/env";
import { auth } from "~/store/auth.store";
import FriendshipActions from "~/components/ui/FriendshipAction/FriendshipActions";

function toDate(value: Date | string): Date {
	return value instanceof Date ? value : new Date(value);
}

export default function ProfileHeader(props: { profile: User }) {
	return <header class="profile-header">
		<img src={`${env.VITE_API_URL}/users/${props.profile.uuid}/avatar`} alt="Profile picture" />
		<div class="header-info">
			<h2>{props.profile.username}</h2>
			<div class="user-stats">
				<div class="stat">Member since {toDate(props.profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>
				<div class="separator" />
				<div class="stat">{props.profile._count.ownedProviders} owned providers</div>
				<div class="separator" />
				<div class="stat">{props.profile._count.ownedPlaylists} playlists</div>
			</div>
			<Show when={props.profile.currentlyListening && props.profile.listeningUntil && toDate(props.profile.listeningUntil) > new Date()}>
				<div class="listening"><MusicBars />Listening to « {props.profile.currentlyListening!.title} » - {props.profile.currentlyListening!.artist}</div>
			</Show>
		</div>
		<Show when={auth.accessToken !== null && auth.jwtPayload.sub !== props.profile.uuid && auth.jwtPayload.sub} keyed>
			{(meUuid) => <FriendshipActions meUuid={meUuid} targetUuid={props.profile.uuid} />}
		</Show>
	</header>;
}
