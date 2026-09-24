import { useNavigate, useParams } from "@solidjs/router";
import { createEffect, For, JSX, Show } from "solid-js";
import { client, queryKeys } from "~/api/client";
import MusicBars from "~/components/graphics/icons/MusicBars";
import { summonErrorToast } from "~/components/ui/Toaster";
import { env } from "~/env";

import "./Profile.scss";

export default function Profile() {
	const params = useParams<{ uuid: string }>();
	const navigate = useNavigate();

	const profile = client.users.getUser.createQuery(queryKeys.users.getUser, {
		params: { uuid: params.uuid },
	});

	createEffect(() => {
		if (profile.isError) {
			// navigate("/home"); // A remettre mais desact car chiant en dev
			summonErrorToast("Unknown user");
		} else if (profile.isSuccess) {
			console.log(profile.data?.body);
		}
	});

	const tmpSearchBarStyle: JSX.CSSProperties = {
		height: "70px",
		position: "fixed",
		top: "0",
		width: "100%",
		background: "var(--background-card)",
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
		background: "var(--background-card)",
		height: "calc(100vh - 140px)",
		position: "fixed",
		top: "70px",
		left: "0",
	};

	return <div style={{ height: "100vh" }}><div id="tmp-search-bar" style={tmpSearchBarStyle}/>
		<div id="tmp-container" style={tmpContainerStyle}>
			<div class="tmp-left-panel" style={tmpLeftPanelStyle}/>
			<div id="user-profile">
				<Show when={profile.data} keyed>{(data) => <>
					<div class="profile-header">
						<img src={env.VITE_API_URL + "/users/" + data.body.uuid + "/avatar"} alt="Profile picture" />
						<div class="header-info">
							<h2>{data.body.username}</h2>
							<div class="user-stats">
								<div class="stat">Member since {new Date(data.body.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) /* rendre dynamique avec i18n*/}</div>
								<div class="separator"/>
								<div class="stat">{data.body._count.ownedProviders} owned providers</div>
								<div class="separator"/>
								<div class="stat">{data.body._count.ownedPlaylists} playlists</div>
							</div>
							<Show when={data.body.currentlyListening && data.body.listeningUntil && new Date(data.body.listeningUntil) > new Date()} keyed>
								<div class="listening"><MusicBars/>Listening to « {data.body.currentlyListening!.title} » - {data.body.currentlyListening!.artist}</div>
							</Show>
						</div>
					</div>
					<section class="providers">
						<h3>Connected providers</h3>
						<div class="providers-list">
							<Show when={data.body.connectedProviders.length > 0}>
								<For each={data.body.connectedProviders}>{(provider) => <div class="provider-card">
									<div class="provider-info">
										<h4>{provider.name}</h4>
										<p>{provider.adress}</p>
									</div>
								</div>}</For>
							</Show>
							<Show when={data.body.connectedProviders.length === 0}>
								<p class="no-providers">No connected providers</p>
							</Show>
						</div>
					</section>
					<section class="providers">
						<h3>Owned providers</h3>
						<div class="providers-list">
							<Show when={data.body.ownedProviders.length > 0}>
								<For each={data.body.ownedProviders}>{(provider) => <div class="provider-card">
									<div class="provider-info">
										<h4>{provider.name}</h4>
										<p>{provider.adress}</p>
									</div>
								</div>}</For>
							</Show>
							<Show when={data.body.ownedProviders.length === 0}>
								<p class="no-providers">No owned providers</p>
							</Show>
						</div>
					</section>
					<section class="playlists">
						<h3>Playlists</h3>
						<div class="playlists-list">
							<Show when={data.body.ownedPlaylists.length > 0}>
								<For each={data.body.ownedPlaylists}>{(playlist) => <div class="playlist-card">
									<img src={env.VITE_API_URL + "/playlists/" + playlist.uuid + "/cover"} alt="playlist logo" />
									<div class="playlist-info">
										<h4>{playlist.name}</h4>
										<p>{playlist._count.musics} musics</p>
									</div>
								</div>}</For>
							</Show>
							<Show when={data.body.ownedPlaylists.length === 0}>
								<p class="no-providers">No owned playlists</p>
							</Show>
						</div>
					</section>
					{/* Same pour les friends */}
				</>}</Show>
			</div>
		</div>
		<div id="tmp-footer" style={{ position: "fixed", bottom: "0", width: "100%", height: "70px", background: "var(--background-card)" }}/>
	</div>;
}
