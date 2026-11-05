import { useParams, useNavigate, A } from "@solidjs/router";
import { createEffect, createMemo, Match, Show, Switch } from "solid-js";
import { summonErrorToast } from "~/components/ui/Toaster";
import { client, queryKeys } from "~/api/client";
import { useProviderInfoQuery } from "~/api/queryHooks/providerInfo";
import ProviderTabMusics from "./ProviderTabMusics";
import ProviderHeader from "./ProviderHeader";
import MusicSection from "../../components/ui/MusicSection/MusicSection";
import "./Provider.scss";
import AlbumSection from "~/components/ui/AlbumSection/AlbumSection";
import ArtistSection from "~/components/ui/ArtistSection/ArtistSection";
import { useTabParam } from "~/components/ui/Tabs/useTabParam";
import Tabs from "~/components/ui/Tabs/Tabs";
import NoResult from "~/components/ui/NoResult/NoResult";
import ProviderTabAlbums from "./ProviderTabAlbums";
import ProviderTabArtists from "./ProviderTabArtists";
import OfflineProvider from "~/components/ui/NoResult/OfflineProvider";

const TABS = ["All", "Musics", "Albums", "Artists"] as const;
type Tab = typeof TABS[number];

export default function Provider() {
	const navigate = useNavigate();
	const params = useParams<{ uuid: string }>();
	const providerBack = client.providers.get.createQuery(() => queryKeys.providers.get([params.uuid]), { params: { uuid: params.uuid } });
	const provider = useProviderInfoQuery(() => providerBack.data?.body.address ?? "", () => params.uuid);

	createEffect(() => {
		if (providerBack.isError) {
			navigate("/home");
			summonErrorToast("Unknown provider");
		}
	});

	const [tab, setTab] = useTabParam<Tab>(TABS, "All");

	return <div class="page" id="provider">
		<Show when={providerBack.data?.body} keyed>{(backData) => <>
			<ProviderHeader provider={provider.data?.body} providerBack={backData} />
			<OfflineProvider show={provider.isError} />
			<Show when={provider.data?.body} keyed>{(providerInfo) => <>
				<Tabs tabs={TABS} value={tab()} onChange={setTab} />
				<Switch>
					<Match when={tab() === "All"}>
						<Show when={providerInfo.music.total > 0}>
							<section class="musics">
								<h2>Musics</h2>
								<MusicSection music={{ musics: providerInfo.music.musics.slice(0, 6), total: providerInfo.music.total }}/>
								<A href={"?tab=Musics"} class="white-variant see-more">See more</A>
							</section>
						</Show>
						<Show when={providerInfo.album.total > 0}>
							<section class="albums">
								<h2>Albums</h2>
								<AlbumSection album={{ albums: providerInfo.album.albums.slice(0, 6), total: providerInfo.album.total }}/>
								<A href={"?tab=Albums"} class="white-variant see-more">See more</A>
							</section>
						</Show>
						<Show when={providerInfo.artist.total > 0}>
							<section class="artists">
								<h2>Artists</h2>
								<ArtistSection artist={{ artists: providerInfo.artist.artists.slice(0, 6), total: providerInfo.artist.total }}/>
								<A href={"?tab=Artists"} class="white-variant see-more">See more</A>
							</section>
						</Show>
						<NoResult show={providerInfo.music.total + providerInfo.album.total + providerInfo.artist.total === 0} />
					</Match>
					<Match when={tab() === "Musics"}>
						<ProviderTabMusics providerUrl={backData.address} providerUuid={params.uuid} />
					</Match>
					<Match when={tab() === "Albums"}>
						<ProviderTabAlbums providerUrl={backData.address} providerUuid={params.uuid} />
					</Match>
					<Match when={tab() === "Artists"}>
						<ProviderTabArtists providerUrl={backData.address} providerUuid={params.uuid} />
					</Match>
				</Switch>
			</>}</Show>
		</>}</Show>
	</div>;
}
