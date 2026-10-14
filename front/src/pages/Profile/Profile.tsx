import { useParams, useNavigate } from "@solidjs/router";
import { createEffect, Show } from "solid-js";
import { summonErrorToast } from "~/components/ui/Toaster";
import PlaylistSection from "./PlaylistSection";
import ProfileHeader from "./ProfileHeader";
import FriendsSection from "./FriendsSection";
import ProviderSection from "./ProviderSection";

import "./Profile.scss";
import { useUserProfileQuery } from "~/api/queryHooks/userProfile";

export default function Profile() {
	const navigate = useNavigate();
	const params = useParams<{ uuid: string }>();
	const profile = useUserProfileQuery(params.uuid);

	createEffect(() => {
		if (profile.isError) {
			navigate("/home"); // !:! A remettre mais desact car chiant en dev
			summonErrorToast("Unknown user");
		}
	});

	return <div class="page" id="user-profile">
		<Show when={profile.data} keyed>{(data) => <>
			<ProfileHeader profile={data.body} />
			<ProviderSection title="Connected providers" emptyMessage="No connected providers" providers={data.body.connectedProviders} />
			<ProviderSection title="Owned providers" emptyMessage="No owned providers" providers={data.body.ownedProviders} />
			<PlaylistSection playlists={data.body.ownedPlaylists} />
			<FriendsSection />
		</>}</Show>
	</div>;
}
