import { useParams } from "@solidjs/router";
import { createEffect, JSX, Show } from "solid-js";
import { client, queryKeys } from "~/api/client";
import { summonErrorToast } from "~/components/ui/Toaster";
import PlaylistSection from "./PlaylistSection";
import ProfileHeader from "./ProfileHeader";
import FriendsSection from "./FriendsSection";
import ProviderSection from "./ProviderSection";

import "./Profile.scss";

export default function Profile() {
	const params = useParams<{ uuid: string }>();
	const profile = client.users.getUser.createQuery(queryKeys.users.getUser, {
		params: { uuid: params.uuid },
	});

	createEffect(() => {
		if (profile.isError) {
			// navigate("/home"); // A remettre mais desact car chiant en dev
			summonErrorToast("Unknown user");
		}
	});

	const tmpSearchBarStyle: JSX.CSSProperties = {
		height: "70px",
		position: "fixed",
		top: "0",
		width: "100%",
		background: "var(--background-surface)",
	};
	const tmpContainerStyle: JSX.CSSProperties = {
		display: "flex",
		"flex-direction": "row",
		"padding-top": "70px",
		"padding-bottom": "70px",
		"padding-left": "200px",
		width: "100%",
	};
	const tmpLeftPanelStyle: JSX.CSSProperties = {
		width: "200px",
		background: "var(--background-surface)",
		height: "calc(100vh - 140px)",
		position: "fixed",
		top: "70px",
		left: "0",
	};

	return <div style={{ height: "100vh" }}><div id="tmp-search-bar" style={tmpSearchBarStyle} />
		<div id="tmp-container" style={tmpContainerStyle}>
			<div class="tmp-left-panel" style={tmpLeftPanelStyle} />
			<div id="user-profile">
				<Show when={profile.data} keyed>{(data) => <>
					<ProfileHeader profile={data.body} />
					<ProviderSection title="Connected providers" emptyMessage="No connected providers" providers={data.body.connectedProviders} />
					<ProviderSection title="Owned providers" emptyMessage="No owned providers" providers={data.body.ownedProviders} />
					<PlaylistSection playlists={data.body.ownedPlaylists} />
					<FriendsSection />
				</>}</Show>
			</div>
		</div>
		<div id="tmp-footer" style={{ position: "fixed", bottom: "0", width: "100%", height: "70px", background: "var(--background-surface)" }}/>
	</div>;
}
