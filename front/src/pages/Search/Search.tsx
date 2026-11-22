import { A, useLocation, useParams } from "@solidjs/router";
import { createEffect, createMemo, createSignal, Match, on, Show, Switch } from "solid-js";
import { type SearchSort, useProvidersSearchQueries } from "~/api/queryHooks/providerInfo";
import "./Search.scss";
import { useProfile } from "~/components/guards/ProfileGate";
import { For } from "solid-js";
import MusicSection from "~/components/ui/MusicSection/MusicSection";
import ArtistSection from "~/components/ui/ArtistSection/ArtistSection";
import AlbumSection from "~/components/ui/AlbumSection/AlbumSection";
import { Music } from "~/class/Music";
import { Album } from "~/class/Album";
import { Artist } from "~/class/Artist";
import { Provider, SEARCH_MAX_LIMIT } from "@flex/shared";
import { BestResult } from "./BestResult";
import PlaylistCard from "~/components/ui/PlaylistCard/PlaylistCard";
import UserCard from "~/components/ui/UserCard/UserCard";
import { useSearchPlaylistsQuery, useSearchProvidersQuery, useSearchUsersQuery } from "~/api/queryHooks/search";
import SearchFilters from "./SearchFilters";
import SortBar from "~/components/ui/SortBar";
import { useSortParam } from "~/components/ui/SortBar/useSortParam";
import InfiniteScroll from "~/components/ui/InfiniteScroll";
import { PAGE_SIZE, pickFilters, TAB_FILTER_FIELDS, TAB_SORT_FIELDS, useSearchFilters } from "./searchFilters";
import NoResult from "~/components/ui/NoResult/NoResult";
import ProviderCard from "~/components/ui/ProviderCard/ProviderCard";
import Tabs from "~/components/ui/Tabs/Tabs";
import { useTabParam } from "~/components/ui/Tabs/useTabParam";
import { compareAlbums, compareArtists, compareMusics, scoreAlbum, scoreArtist, scoreMusic, sortByScore } from "~/utils/sortUtils";

const TABS = ["All", "Musics", "Albums", "Artists", "Playlists", "Users", "Providers"] as const;
export type Tab = typeof TABS[number];

export default function Search() {
	const params = useParams<{ search: string }>();
	const me = useProfile();

	const providers = createMemo(() => {
		const body = me();
		const all = [...body.ownedProviders, ...body.connectedProviders];
		return all.filter((provider, i) => all.findIndex((p) => p.uuid === provider.uuid) === i);
	});
	const search = () => decodeURIComponent(params.search ?? "");

	const [tab, setTab] = useTabParam(TABS, "All");
	const location = useLocation();
	const [filters, setFilters] = useSearchFilters();
	const [sort, setSort] = useSortParam(() => TAB_SORT_FIELDS[tab()]);
	const [loadedPages, setLoadedPages] = createSignal(1);
	const visibleCount = () => loadedPages() * PAGE_SIZE;
	const appliedFilters = createMemo(() => pickFilters(filters(), TAB_FILTER_FIELDS[tab()]));
	const paginated = () => TAB_SORT_FIELDS[tab()].length > 0;
	const providerSort = () => sort()?.field === "provider"
		? sort()
		: undefined;
	const providersSort = (): SearchSort | undefined => {
		const current = sort();
		return current && current.field !== "provider"
			? { field: current.field, order: current.order }
			: undefined;
	};
	const searchOptions = createMemo(() => ({
		sort: providersSort(),
		limit: paginated()
			? Math.min(SEARCH_MAX_LIMIT, visibleCount())
			: undefined,
	}));
	const searches = useProvidersSearchQueries(() => providers(), search, () => appliedFilters(), () => searchOptions());

	const users = useSearchUsersQuery(search, () => tab() === "Users");
	const playlists = useSearchPlaylistsQuery(search, () => tab() === "Playlists");
	const providerSearch = useSearchProvidersQuery(search, () => tab() === "Providers");

	const tabHref = (target: Tab) => {
		const query = new URLSearchParams(location.search);
		query.set("tab", target);
		return `/search/${encodeURIComponent(search())}?${query.toString()}`;
	};

	const results = createMemo(() => {
		const data = providers().map((provider, i) => ({
			provider,
			isLoading: searches[i]?.isLoading ?? true,
			error: searches[i]?.error,
			musics: searches[i]?.data?.body.musics ?? [],
			albums: searches[i]?.data?.body.albums ?? [],
			artists: searches[i]?.data?.body.artists ?? [],
		}));

		const sorting = providersSort();
		const byProvider = providerSort();
		const names = new Map(providers().map((provider) => [provider.uuid, provider.name]));
		const providerName = (uuid: string) => names.get(uuid) ?? "";
		function arrange<T>(items: T[], score: (item: T) => number, providerUuid: (item: T) => string, compare: (a: T, b: T) => number) {
			const ranked = sortByScore(items, score);
			if (byProvider) {
				const direction = byProvider.order === "desc"
					? -1
					: 1;
				return ranked.sort((a, b) => direction * providerName(providerUuid(a)).localeCompare(providerName(providerUuid(b)), undefined, { sensitivity: "base" }));
			}
			return sorting
				? ranked.sort(compare)
				: ranked;
		}

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
			musics: arrange(data.flatMap((d) => d.musics), (m) => scoreMusic(m, search()), (m) => m.provider.uuid, (a, b) => sorting ? compareMusics(a, b, sorting) : 0),
			albums: arrange(data.flatMap((d) => d.albums), (a) => scoreAlbum(a, search()), (a) => a.providerUuid, (a, b) => sorting ? compareAlbums(a, b, sorting) : 0),
			artists: arrange(data.flatMap((d) => d.artists), (a) => scoreArtist(a, search()), (a) => a.providerUuid, (a, b) => sorting ? compareArtists(a, b, sorting) : 0),
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
					providerName: organizedData.providers.find((p) => p.uuid === organizedData.musics[0].provider.uuid)?.name ?? "",
				};
			}
		} else if (bestScores.albums > bestScores.artists) {
			if (organizedData.albums[0]) {
				organizedData.best = {
					item: organizedData.albums[0],
					providerName: organizedData.providers.find((p) => p.uuid === organizedData.albums[0].provider.uuid)?.name ?? "",
				};
			}
		} else if (bestScores.artists > 0) {
			if (organizedData.artists[0]) {
				organizedData.best = {
					item: organizedData.artists[0],
					providerName: organizedData.providers.find((p) => p.uuid === organizedData.artists[0].provider.uuid)?.name ?? "",
				};
			}
		}

		return organizedData;
	});

	const total = createMemo(() => {
		const key = tab() === "Musics"
			? "musics"
			: tab() === "Albums"
				? "albums"
				: "artists";
		return searches.reduce((sum, query) => sum + (query.data?.body.totals[key] ?? 0), 0);
	});
	const hasMore = () => visibleCount() < Math.min(total(), SEARCH_MAX_LIMIT);
	const isFetching = () => searches.some((query) => query.isFetching);
	function visible<T>(items: T[]) {
		return items.slice(0, visibleCount());
	}

	createEffect(on(
		() => [tab(), search(), JSON.stringify(filters()), JSON.stringify(sort())],
		() => setLoadedPages(1),
		{ defer: true },
	));

	return <div class="page" id="search">
		<Tabs tabs={TABS} value={tab()} onChange={setTab} />
		<SearchFilters fields={TAB_FILTER_FIELDS[tab()]} value={filters()} onChange={setFilters} />
		<Show when={tab() !== "Musics"}>
			<SortBar fields={TAB_SORT_FIELDS[tab()]} value={sort()} onChange={setSort} />
		</Show>
		<Switch>
			<Match when={tab() === "All"}>
				<BestResult best={results().best} />
				<Show when={results().musics.length > 0}>
					<section class="musics">
						<h2>Musics</h2>
						<MusicSection musics={results().musics.slice(0, 6)} providers={results().providers}/>
						<A href={tabHref("Musics")} class="white-variant see-more">See more</A>
					</section>
				</Show>
				<Show when={results().albums.length > 0}>
					<section class="albums">
						<h2>Albums</h2>
						<AlbumSection album={{ albums: results().albums.slice(0, 6), total: results().albums.length }} providers={results().providers}/>
						<A href={tabHref("Albums")} class="white-variant see-more">See more</A>
					</section>
				</Show>
				<Show when={results().artists.length > 0}>
					<section class="artists">
						<h2>Artists</h2>
						<ArtistSection artist={{ artists: results().artists.slice(0, 6), total: results().artists.length }} providers={results().providers}/>
						<A href={tabHref("Artists")} class="white-variant see-more">See more</A>
					</section>
				</Show>
				<NoResult show={results().musics.length + results().albums.length + results().artists.length === 0} />
			</Match>
			<Match when={tab() === "Musics"}>
				<Show when={results().musics.length > 0}>
					<section class="musics">
						<h2>Musics</h2>
						<MusicSection musics={visible(results().musics)} providers={results().providers} sort={{ value: sort(), onChange: setSort }}/>
					</section>
					<InfiniteScroll enabled={hasMore() && !isFetching()} onLoadMore={() => setLoadedPages((pages) => pages + 1)} />
				</Show>
				<NoResult show={results().musics.length === 0} />
			</Match>
			<Match when={tab() === "Albums"}>
				<Show when={results().albums.length > 0}>
					<section class="albums">
						<h2>Albums</h2>
						<AlbumSection album={{ albums: visible(results().albums), total: total() }} providers={results().providers} />
					</section>
					<InfiniteScroll enabled={hasMore() && !isFetching()} onLoadMore={() => setLoadedPages((pages) => pages + 1)} />
				</Show>
				<NoResult show={results().albums.length === 0} />
			</Match>
			<Match when={tab() === "Artists"}>
				<Show when={results().artists.length > 0}>
					<section class="artists">
						<h2>Artists</h2>
						<ArtistSection artist={{ artists: visible(results().artists), total: total() }} providers={results().providers} />
					</section>
					<InfiniteScroll enabled={hasMore() && !isFetching()} onLoadMore={() => setLoadedPages((pages) => pages + 1)} />
				</Show>
				<NoResult show={results().artists.length === 0} />
			</Match>
			<Match when={tab() === "Playlists"}>
				<Show when={(playlists.data?.body.length ?? 0) > 0}>
					<section class="playlists">
						<h2>Playlists</h2>
						<div class="playlists-grid">
							<For each={playlists.data?.body}>{(playlist) => <PlaylistCard playlist={playlist} showOwner />}</For>
						</div>
					</section>
				</Show>
				<Show when={playlists.isError}><p class="search-error">Failed to search playlists</p></Show>
				<NoResult show={playlists.isSuccess && playlists.data.body.length === 0} />
			</Match>
			<Match when={tab() === "Users"}>
				<Show when={(users.data?.body.length ?? 0) > 0}>
					<section class="users">
						<h2>Users</h2>
						<div class="users-list">
							<For each={users.data?.body}>{(user) => <UserCard user={user} />}</For>
						</div>
					</section>
				</Show>
				<Show when={users.isError}><p class="search-error">Failed to search users</p></Show>
				<NoResult show={users.isSuccess && users.data.body.length === 0} />
			</Match>
			<Match when={tab() === "Providers"}>
				<Show when={(providerSearch.data?.body.length ?? 0) > 0}>
					<section class="providers">
						<h2>Providers</h2>
						<div class="providers-list">
							<For each={providerSearch.data?.body}>{(provider) => <ProviderCard provider={provider} mine={false}/>}</For>
						</div>
					</section>
				</Show>
				<Show when={providerSearch.isError}><p class="search-error">Failed to search providers</p></Show>
				<NoResult show={providerSearch.isSuccess && providerSearch.data.body.length === 0} />
			</Match>
		</Switch>
	</div>;
}
