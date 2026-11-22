import { useParams, useNavigate } from "@solidjs/router";
import { createEffect, Show } from "solid-js";
import { summonErrorToast } from "~/components/ui/Toaster";
import PlaylistSection from "./PlaylistSection";
import ProfileHeader from "./ProfileHeader";
import FriendsSection from "./FriendsSection";
import ProviderSection from "./ProviderSection";

import "./Profile.scss";
import { useUserProfileQuery } from "~/api/queryHooks/userProfile";
import { useTranslation } from "~/i18n/context";


export default function Profile() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const params = useParams<{ uuid: string }>();
	const profile = useUserProfileQuery(() => params.uuid);

	createEffect(() => {
		if (profile.isError) {
			navigate("/home"); // !:! A remettre mais desact car chiant en dev
			summonErrorToast(() => t("pages.profile.unknownUser"));
		}
	});

	return <div class="page" id="user-profile">
		<Show when={profile.data} keyed>{(data) => <>
			<ProfileHeader profile={data.body} />
			<ProviderSection title={t("pages.profile.connectedProviders")} emptyMessage={t("pages.profile.noConnectedProviders")} providers={data.body.connectedProviders} />
			<ProviderSection title={t("pages.profile.ownedProviders")} emptyMessage={t("pages.profile.noOwnedProviders")} providers={data.body.ownedProviders} />
			<PlaylistSection playlists={data.body.ownedPlaylists} />
			<FriendsSection friends={data.body.friends}/>
		</>}</Show>
	</div>;
}
