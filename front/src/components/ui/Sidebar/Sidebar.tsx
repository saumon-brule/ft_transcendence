import { A } from "@solidjs/router";
import "./Sidebar.scss";
import { useMeProfileQuery } from "~/api/queryHooks/meProfile";
import { createSignal, For, Show } from "solid-js";
import ProviderCard from "../ProviderCard/ProviderCard";
import { DiscAlbum, Home, Server } from "lucide-solid";
import { env } from "~/env";

export default function Sidebar() {
	const profileQuery = useMeProfileQuery();
	const providers = () => profileQuery.data?.body ? [...profileQuery.data.body.ownedProviders, ...profileQuery.data.body.connectedProviders] : [];
	const playlists = () => profileQuery.data?.body ? profileQuery.data.body.ownedPlaylists : [];

	const [showAllPlaylists, setShowAllPlaylists] = createSignal(false);
	const [showAllProviders, setShowAllProviders] = createSignal(false);

	return <Show when={profileQuery.data?.body} keyed>{(profile) => <div id="app-sidebar">
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
				<div class="list paylists-container">
					<For each={showAllPlaylists() ? playlists() : playlists().slice(0, 4)}>{(playlist) => <A class="playlist-card" href={`/playlist/${playlist.uuid}`}>
						<img src={`${env.VITE_API_URL}/playlists/${playlist.uuid}/cover`} alt="playlist logo" />
						<div class="playlist-info">
							<h4>{playlist.name}</h4>
							<p>{playlist._count.musics} musics</p>
						</div>
					</A>}</For>
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
					<For each={showAllProviders() ? providers() : providers().slice(0, 4)}>{(provider) =>
						<ProviderCard provider={provider} mine={false} small={true}/>
					}</For>
				</div>
			</section>
		</Show>
		<section class="legal-links">
			<A class="external-link" href="/privacy-policy">Privacy Policy</A>
			<A class="external-link" href="/terms-of-service">Terms of Service</A>
		</section>
	</div>}</Show>;
}
