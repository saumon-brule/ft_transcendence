import { A, useParams } from "@solidjs/router";
import { createMemo, Match, Show, Switch } from "solid-js";
import { useProvidersSearchQueries } from "~/api/queryHooks/providerInfo";
import "./Search.scss";
import { useMeProfileQuery } from "~/api/queryHooks/meProfile";
import { For } from "solid-js";
import MusicSection from "~/components/ui/MusicSection/MusicSection";
import ArtistSection from "~/components/ui/ArtistSection/ArtistSection";
import AlbumSection from "~/components/ui/AlbumSection/AlbumSection";
import { Music } from "~/class/Music";
import { Album } from "~/class/Album";
import { Artist } from "~/class/Artist";
import { Provider } from "@flex/shared";
import { BestResult } from "./BestResult";
import NoResult from "~/components/ui/NoResult/NoResult";
import ProviderCard from "~/components/ui/ProviderCard/ProviderCard";
import Tabs from "~/components/ui/Tabs/Tabs";
import { useTabParam } from "~/components/ui/Tabs/useTabParam";
import { scoreAlbum, scoreArtist, scoreMusic, sortByScore } from "~/utils/sortUtils";

const TABS = ["All", "Musics", "Albums", "Artists", "Playlists", "Users", "Providers"] as const;
export type Tab = typeof TABS[number];

export default function Search() {
	const params = useParams<{ search: string }>();
	const profileQuery = useMeProfileQuery();

	const providers = createMemo(() => {
		const body = profileQuery.data?.body;
		if (!body) return [];
		const all = [...body.ownedProviders, ...body.connectedProviders];
		return all.filter((provider, i) => all.findIndex((p) => p.uuid === provider.uuid) === i);
	});
	const search = () => decodeURIComponent(params.search ?? "");
	const searches = useProvidersSearchQueries(() => providers(), search);

	const results = createMemo(() => {
		const data = providers().map((provider, i) => ({
			provider,
			isLoading: searches[i]?.isLoading ?? true,
			error: searches[i]?.error,
			musics: searches[i]?.data?.body.musics ?? [],
			albums: searches[i]?.data?.body.albums ?? [],
			artists: searches[i]?.data?.body.artists ?? [],
		}));

		const organizedData: {
			musics: Music[];
			albums: Album[];
			artists: Artist[];
			best: {
				item: Music | Album | Artist;
				providerName: string;
			} | null;
			providers: Provider[];
		} = {
			musics: sortByScore(data.flatMap((d) => d.musics), (m) => scoreMusic(m, search())),
			albums: sortByScore(data.flatMap((d) => d.albums), (a) => scoreAlbum(a, search())),
			artists: sortByScore(data.flatMap((d) => d.artists), (a) => scoreArtist(a, search())),
			best: null,
			providers: (data.filter((d) => d.musics.length + d.albums.length + d.artists.length > 0 || d.provider.name.toLocaleLowerCase().includes(search().toLowerCase()))).map((d) => d.provider),
		};

		const bestScores = {
			musics: organizedData.musics[0] ? scoreMusic(organizedData.musics[0], search()) : 0,
			albums: organizedData.albums[0] ? scoreAlbum(organizedData.albums[0], search()) : 0,
			artists: organizedData.artists[0] ? scoreArtist(organizedData.artists[0], search()) : 0,
		};
		if (bestScores.musics > bestScores.albums && bestScores.musics > bestScores.artists) {
			if (organizedData.musics[0]) {
				organizedData.best = {
					item: organizedData.musics[0],
					providerName: organizedData.providers.find((p) => p.uuid === organizedData.musics[0].providerUuid)?.name ?? "",
				};
			}
		} else if (bestScores.albums > bestScores.artists) {
			if (organizedData.albums[0]) {
				organizedData.best = {
					item: organizedData.albums[0],
					providerName: organizedData.providers.find((p) => p.uuid === organizedData.albums[0].providerUuid)?.name ?? "",
				};
			}
		} else if (bestScores.artists > 0) {
			if (organizedData.artists[0]) {
				organizedData.best = {
					item: organizedData.artists[0],
					providerName: organizedData.providers.find((p) => p.uuid === organizedData.artists[0].providerUuid)?.name ?? "",
				};
			}
		}

		return organizedData;
	});

	const [tab, setTab] = useTabParam(TABS, "All");

	return <div class="page" id="search">
		<Tabs tabs={TABS} value={tab()} onChange={setTab} />
		<Switch>
			<Match when={tab() === "All"}>
				<BestResult best={results().best} />
				<Show when={results().musics.length > 0}>
					<section class="musics">
						<h2>Musics</h2>
						<MusicSection music={{ musics: results().musics.slice(0, 6), total: results().musics.length }} providers={results().providers}/>
						<A href={`/search/${encodeURIComponent(search())}?tab=Musics`} class="white-variant see-more">See more</A>
					</section>
				</Show>
				<Show when={results().albums.length > 0}>
					<section class="albums">
						<h2>Albums</h2>
						<AlbumSection album={{ albums: results().albums.slice(0, 6), total: results().albums.length }} providers={results().providers}/>
						<A href={`/search/${encodeURIComponent(search())}?tab=Albums`} class="white-variant see-more">See more</A>
					</section>
				</Show>
				<Show when={results().artists.length > 0}>
					<section class="artists">
						<h2>Artists</h2>
						<ArtistSection artist={{ artists: results().artists.slice(0, 6), total: results().artists.length }} providers={results().providers}/>
						<A href={`/search/${encodeURIComponent(search())}?tab=Artists`} class="white-variant see-more">See more</A>
					</section>
				</Show>
				<NoResult show={results().musics.length + results().albums.length + results().artists.length === 0} />
			</Match>
			<Match when={tab() === "Musics"}>
				<Show when={results().musics.length > 0}>
					<section class="musics">
						<h2>Musics</h2>
						<MusicSection music={{ musics: results().musics, total: results().musics.length }} providers={results().providers}/>
					</section>
				</Show>
				<NoResult show={results().musics.length === 0} />
			</Match>
			<Match when={tab() === "Albums"}>
				<Show when={results().albums.length > 0}>
					<section class="albums">
						<h2>Albums</h2>
						<AlbumSection album={{ albums: results().albums, total: results().albums.length }} providers={results().providers} />
					</section>
				</Show>
				<NoResult show={results().albums.length === 0} />
			</Match>
			<Match when={tab() === "Artists"}>
				<Show when={results().artists.length > 0}>
					<section class="artists">
						<h2>Artists</h2>
						<ArtistSection artist={{ artists: results().artists, total: results().artists.length }} providers={results().providers} />
					</section>
				</Show>
				<NoResult show={results().artists.length === 0} />
			</Match>
			<Match when={tab() === "Playlists"}>
				<p>Comming soon</p>
			</Match>
			<Match when={tab() === "Users"}>
				<p>Comming soon</p>
			</Match>
			<Match when={tab() === "Providers"}>
				<Show when={results().providers.length > 0}>
					<section class="providers">
						<h2>Providers</h2>
						<div class="providers-list">
							<For each={results().providers}>{(provider) => <ProviderCard provider={provider} mine={false}/>}</For>
						</div>
					</section>
				</Show>
				<NoResult show={results().providers.length === 0} />
			</Match>
		</Switch>
	</div>;
}
