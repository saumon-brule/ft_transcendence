import { useParams, useNavigate, A } from "@solidjs/router";
import { createEffect, createMemo, Match, Show, Switch } from "solid-js";
import { summonErrorToast } from "~/components/ui/Toaster";
import { client, queryKeys } from "~/api/client";
import { useProviderInfoQuery } from "~/api/queryHooks/providerInfo";
import ProviderHeader from "./ProviderHeader";
import MusicSection from "../../components/ui/MusicSection/MusicSection";
import "./Provider.scss";
import AlbumSection from "~/components/ui/AlbumSection/AlbumSection";
import ArtistSection from "~/components/ui/ArtistSection/ArtistSection";
import { useTabParam } from "~/components/ui/Tabs/useTabParam";
import Tabs from "~/components/ui/Tabs/Tabs";
import NoResult from "~/components/ui/NoResult/NoResult";

const TABS = ["All", "Musics", "Albums", "Artists"] as const;
type Tab = typeof TABS[number];

export default function Provider() {
	const navigate = useNavigate();
	const params = useParams<{ uuid: string }>();
	const providerBack = client.providers.get.createQuery(() => queryKeys.providers.get([params.uuid]), { params: { uuid: params.uuid } });
	const provider = useProviderInfoQuery(() => providerBack.data?.body.address ?? "", () => params.uuid);
	const data = createMemo(() => provider.data && providerBack.data
		? { info: provider.data.body, back: providerBack.data.body }
		: undefined);

	createEffect(() => {
		if (providerBack.isError) {
			navigate("/home");
			summonErrorToast("Unknown provider");
		}
	});

	const [tab, setTab] = useTabParam<Tab>(TABS, "All");

	return <div class="page" id="provider">
		<Show when={data()} keyed>{(data) => <>
			<ProviderHeader provider={data.info} providerBack={data.back} />
			<Tabs tabs={TABS} value={tab()} onChange={setTab} />
			<Switch>
				<Match when={tab() === "All"}>
					<Show when={data.info.music.total > 0}>
						<section class="musics">
							<h2>Musics</h2>
							<MusicSection music={{ musics: data.info.music.musics.slice(0, 6), total: data.info.music.total }}/>
							<A href={"?tab=Musics"} class="white-variant see-more">See more</A>
						</section>
					</Show>
					<Show when={data.info.album.total > 0}>
						<section class="albums">
							<h2>Albums</h2>
							<AlbumSection album={{ albums: data.info.album.albums.slice(0, 6), total: data.info.album.total }}/>
							<A href={"?tab=Albums"} class="white-variant see-more">See more</A>
						</section>
					</Show>
					<Show when={data.info.artist.total > 0}>
						<section class="artists">
							<h2>Artists</h2>
							<ArtistSection artist={{ artists: data.info.artist.artists.slice(0, 6), total: data.info.artist.total }}/>
							<A href={"?tab=Artists"} class="white-variant see-more">See more</A>
						</section>
					</Show>
					<NoResult show={data.info.music.total + data.info.album.total + data.info.artist.total === 0} />
				</Match>
				<Match when={tab() === "Musics"}>
					<Show when={data.info.music.total > 0}>
						<section class="musics">
							<h2>Musics</h2>
							<MusicSection music={data.info.music}/>
						</section>
					</Show>
					<NoResult show={data.info.music.total === 0} />
				</Match>
				<Match when={tab() === "Albums"}>
					<Show when={data.info.album.total > 0}>
						<section class="albums">
							<h2>Albums</h2>
							<AlbumSection album={data.info.album} />
						</section>
					</Show>
					<NoResult show={data.info.album.total === 0} />
				</Match>
				<Match when={tab() === "Artists"}>
					<Show when={data.info.artist.total > 0}>
						<section class="artists">
							<h2>Artists</h2>
							<ArtistSection artist={data.info.artist} />
						</section>
					</Show>
					<NoResult show={data.info.artist.total === 0} />
				</Match>
			</Switch>
		</>}</Show>
	</div>;
}
