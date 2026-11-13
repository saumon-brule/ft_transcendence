import { A, useLocation } from "@solidjs/router";
import "./Sidebar.scss";
import { useMeProfileQuery } from "~/api/queryHooks/meProfile";
import { createEffect, createSignal, For, on, Show } from "solid-js";
import { isSidebarOpen, sidebarActions } from "~/store/sidebar.store";
import ProviderCard from "../ProviderCard/ProviderCard";
import { DiscAlbum, Home, Server } from "lucide-solid";
import { usePlaylistsQuery } from "~/api/queryHooks/playlist";
import PlaylistCard from "../PlaylistCard/PlaylistCard";

export default function Sidebar() {
	const profileQuery = useMeProfileQuery();
	const providers = () => profileQuery.data?.body ? [...profileQuery.data.body.ownedProviders, ...profileQuery.data.body.connectedProviders] : [];
	const playlistsQuery = usePlaylistsQuery();
	const playlists = () => playlistsQuery.data
		? [
			...playlistsQuery.data.owned.map((playlist) => ({ playlist, showOwner: false })),
			...playlistsQuery.data.followed.map((playlist) => ({ playlist, showOwner: true })),
		]
		: [];

	const [showAllPlaylists, setShowAllPlaylists] = createSignal(false);
	const [showAllProviders, setShowAllProviders] = createSignal(false);

	const location = useLocation();
	createEffect(on(() => location.pathname, () => sidebarActions.close(), { defer: true }));

	return <div id="app-sidebar" classList={{ active: isSidebarOpen() }}>
		<section>
			<div class="link-container">
				<A class="white-variant icon-link" href="/home" end><Home/> Home</A>
				<A class="white-variant icon-link" href="/providers" end><Server/> Providers</A>
				<A class="white-variant icon-link" href="/playlists" end><DiscAlbum/> Playlists</A>
			</div>
		</section>
		<Show when={playlists().length > 0}>
			<section>
				<div class="section-heading">
					<h2>Playlists</h2>
					<Show when={playlists().length > 4}>
						<a href="#" onClick={(event) => { event.preventDefault(); setShowAllPlaylists((value) => !value); }}>
							{showAllPlaylists() ? "Show less" : "Show more"}
						</a>
					</Show>
				</div>
				<div class="list">
					<For each={showAllPlaylists() ? playlists() : playlists().slice(0, 4)}>{(item) => <PlaylistCard playlist={item.playlist} showOwner={item.showOwner} variant="row" />}</For>
				</div>
			</section>
		</Show>
		<Show when={providers().length > 0}>
			<section>
				<div class="section-heading">
					<h2>Providers</h2>
					<Show when={providers().length > 4}>
						<a href="#" onClick={(event) => { event.preventDefault(); setShowAllProviders((value) => !value); }}>
							{showAllProviders() ? "Show less" : "Show more"}
						</a>
					</Show>
				</div>
				<div class="list providers-container">
					<For each={showAllProviders() ? providers() : providers().slice(0, 4)}>{(provider) => <ProviderCard provider={provider} mine={false} small={true}/>
					}</For>
				</div>
			</section>
		</Show>
		<section class="legal-links">
			<A class="external-link" href="/privacy-policy">Privacy Policy</A>
			<A class="external-link" href="/terms-of-service">Terms of Service</A>
		</section>
	</div>;
}
