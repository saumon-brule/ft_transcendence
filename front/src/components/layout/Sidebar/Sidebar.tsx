import { A, useLocation, useNavigate } from "@solidjs/router";
import "./Sidebar.scss";
import { useProfile } from "~/components/guards/ProfileGate";
import { createEffect, createSignal, For, on, Show } from "solid-js";
import { isSidebarOpen, sidebarActions } from "~/store/sidebar.store";
import ProviderCard from "~/components/ui/cards/ProviderCard/ProviderCard";
import { DiscAlbum, Home, Server } from "lucide-solid";
import { usePlaylistsQuery } from "~/api/queryHooks/playlist";
import PlaylistCard, { NewPlaylistCard } from "~/components/ui/cards/PlaylistCard/PlaylistCard";
import { summonNewPlaylistPopUp } from "~/pages/Playlists/popUps/newPlaylistPopUp";
import { useTranslation } from "~/i18n/context";

export default function Sidebar() {
	const { t } = useTranslation();
	const me = useProfile();
	const providers = () => [...me().ownedProviders, ...me().connectedProviders];
	const playlistsQuery = usePlaylistsQuery();
	const playlists = () => playlistsQuery.data
		? [
			...playlistsQuery.data.body.owned.map((playlist) => ({ playlist, showOwner: false })),
			...playlistsQuery.data.body.followed.map((playlist) => ({ playlist, showOwner: true })),
		]
		: [];

	const [showAllPlaylists, setShowAllPlaylists] = createSignal(false);
	const [showAllProviders, setShowAllProviders] = createSignal(false);

	const location = useLocation();
	const navigate = useNavigate();
	createEffect(on(() => location.pathname, () => sidebarActions.close(), { defer: true }));

	return <div id="app-sidebar" classList={{ active: isSidebarOpen() }}>
		<section>
			<div class="link-container">
				<A class="white-variant icon-link" href="/home" end><Home/> {t("components.sidebar.home")}</A>
				<A class="white-variant icon-link" href="/providers" end><Server/> {t("components.sidebar.providers")}</A>
				<A class="white-variant icon-link" href="/playlists" end><DiscAlbum/> {t("components.sidebar.playlists")}</A>
			</div>
		</section>
		<section>
			<div class="section-heading">
				<h2>{t("components.sidebar.playlists")}</h2>
				<Show when={playlists().length > 4}>
					<a href="#" onClick={(event) => { event.preventDefault(); setShowAllPlaylists((value) => !value); }}>
						{showAllPlaylists() ? t("common.showLess") : t("common.showMore")}
					</a>
				</Show>
			</div>
			<div class="list">
				<NewPlaylistCard variant="row" onClick={() => summonNewPlaylistPopUp((uuid) => navigate(`/playlist/${uuid}`))} />
				<For each={showAllPlaylists() ? playlists() : playlists().slice(0, 4)}>{(item) => <PlaylistCard playlist={item.playlist} showOwner={item.showOwner} variant="row" />}</For>
			</div>
		</section>
		<Show when={providers().length > 0}>
			<section>
				<div class="section-heading">
					<h2>{t("components.sidebar.providers")}</h2>
					<Show when={providers().length > 4}>
						<a href="#" onClick={(event) => { event.preventDefault(); setShowAllProviders((value) => !value); }}>
							{showAllProviders() ? t("common.showLess") : t("common.showMore")}
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
			<A class="external-link" href="/privacy-policy">{t("components.sidebar.privacyPolicy")}</A>
			<A class="external-link" href="/terms-of-service">{t("components.sidebar.termsOfService")}</A>
		</section>
	</div>;
}
