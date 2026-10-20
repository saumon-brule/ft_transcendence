import { useParams } from "@solidjs/router";
import { createEffect, Show } from "solid-js";
import { client, queryKeys } from "~/api/client";
import { summonErrorToast } from "~/components/ui/Toaster";
import PlaylistSection from "./PlaylistSection";
import ProfileHeader from "./ProfileHeader";
import FriendsSection from "./FriendsSection";
import ProviderSection from "./ProviderSection";

import "./Profile.scss";

export default function Profile() {
	const params = useParams<{ uuid: string }>();
	const profile = client.users.getUser.createQuery(() => queryKeys.users.getUser([params.uuid]), {
		params: { get uuid() { return params.uuid; } },
	});

	createEffect(() => {
		if (profile.isError) {
			// navigate("/home"); // A remettre mais desact car chiant en dev
			summonErrorToast("Unknown user");
		}
	});

	return <div id="user-profile">
		<Show when={profile.data} keyed>{(data) => <>
			<ProfileHeader profile={data.body} />
			<ProviderSection title="Connected providers" emptyMessage="No connected providers" providers={data.body.connectedProviders} />
			<ProviderSection title="Owned providers" emptyMessage="No owned providers" providers={data.body.ownedProviders} />
			<PlaylistSection playlists={data.body.ownedPlaylists} />
			<FriendsSection friends={data.body.friends}/>
		</>}</Show>
	</div>;
}
