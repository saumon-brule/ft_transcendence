import { Show } from "solid-js";
import type { User } from "@flex/shared";
import MusicBars from "~/components/graphics/icons/MusicBars";
import { env } from "~/env";
import { auth } from "~/store/auth.store";
import FriendshipActions from "~/components/ui/FriendshipAction/FriendshipActions";
import { useTranslation } from "~/i18n/context";

function toDate(value: Date | string): Date {
	return value instanceof Date ? value : new Date(value);
}

export default function ProfileHeader(props: { profile: User }) {
	const { t, locale } = useTranslation();
	return <header class="profile-header">
		<img src={`${env.VITE_API_URL}/users/${props.profile.uuid}/avatar`} alt={t("pages.profile.picture")} />
		<div class="header-info">
			<h2>{props.profile.username}</h2>
			<div class="user-stats">
				<div class="stat">{t("components.profileStats.memberSince", { date: toDate(props.profile.createdAt).toLocaleDateString(locale(), { month: "long", year: "numeric" }) })}</div>
				<div class="separator" />
				<div class="stat">{t("components.profileStats.ownedProviders", { count: String(props.profile._count.ownedProviders) })}</div>
				<div class="separator" />
				<div class="stat">{t("components.profileStats.playlists", { count: String(props.profile._count.ownedPlaylists) })}</div>
			</div>
			<Show when={props.profile.currentlyListening && props.profile.listeningUntil && toDate(props.profile.listeningUntil) > new Date()}>
				<div class="listening"><MusicBars />{t("components.profileStats.listening", { title: props.profile.currentlyListening!.title, artist: props.profile.currentlyListening!.artist })}</div>
			</Show>
		</div>
		<Show when={auth.accessToken !== null && auth.jwtPayload.sub !== props.profile.uuid && auth.jwtPayload.sub} keyed>
			{(meUuid) => <FriendshipActions meUuid={meUuid} targetUuid={props.profile.uuid} />}
		</Show>
	</header>;
}
