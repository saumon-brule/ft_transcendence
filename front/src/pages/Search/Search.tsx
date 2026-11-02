import { A, useParams, useSearchParams } from "@solidjs/router";
import { createEffect, createMemo, Match, on, onCleanup, onMount, Show, Switch } from "solid-js";
import { useProvidersSearchQueries } from "~/api/queryHooks/providerInfo";
import "./Search.scss";
import { useMeProfileQuery } from "~/api/queryHooks/meProfile";
import { For } from "solid-js";
import Button from "~/components/inputs/Button";
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

const TABS = ["All", "Musics", "Albums", "Artists", "Playlists", "Users", "Providers"] as const;
export type Tab = typeof TABS[number];

// const TABLES: Record<SearchTable, { from: Prisma.Sql; fields: SearchField[] }> = {
// 	Music: { from: Prisma.raw("\"Music\""), fields: [field("name", 3), field("searchArtists", 2), field("searchAlbum", 1)] },
// 	Artist: { from: Prisma.raw("\"Artist\""), fields: [field("name", 1)] },
// 	Album: { from: Prisma.raw("\"Album\""), fields: [field("name", 3), field("searchArtists", 2)] },
// };

const normalize = (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const tokensOf = (value: string) => value.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
const MIN_FUZZY_LENGTH = 3;
const POINTS_EXACT = 1.0;
const POINTS_PREFIX = 0.8;
const POINTS_FUZZY = 0.5;

const BONUS_TITLE_MATCH = 5;
const BONUS_TITLE_STARTS_WITH = 2;
const BONUS_COVERING = 1;
const MALUS_WORD_NOT_FOUND = -1;

function withinOneEdit(a: string, b: string) {
	if (Math.abs(a.length - b.length) > 1) return false;
	let i = 0;
	let j = 0;
	let edits = 0;
	while (i < a.length && j < b.length) {
		if (a[i] === b[j]) {
			i++;
			j++;
			continue;
		}
		if (++edits > 1) return false;
		if (a.length >= b.length) i++;
		if (a.length <= b.length) j++;
	}
	return edits + (a.length - i) + (b.length - j) <= 1;
}

function tokenPoints(queryToken: string, fieldTokens: string[]) {
	let best = 0;
	for (const token of fieldTokens) {
		if (token === queryToken) return POINTS_EXACT;
		if (token.startsWith(queryToken)) best = Math.max(best, POINTS_PREFIX);
		else if (queryToken.length >= MIN_FUZZY_LENGTH && withinOneEdit(queryToken, token)) best = Math.max(best, POINTS_FUZZY);
	}
	return best;
}

function scoreFields(title: string, fields: { value: string; boost: number }[], query: string) {
	const queryTokens = tokensOf(normalize(query));
	if (queryTokens.length === 0) return 0;
	const tokenized = fields.map(({ value, boost }) => ({ tokens: tokensOf(normalize(value)), boost }));

	let score = 0;
	let found = 0;
	for (const queryToken of queryTokens) {
		const best = Math.max(...tokenized.map(({ tokens, boost }) => tokenPoints(queryToken, tokens) * boost));
		if (best > 0) found++;
		else score += MALUS_WORD_NOT_FOUND;
		score += best;
	}

	const normalizedTitle = tokensOf(normalize(title)).join(" ");
	const normalizedQuery = queryTokens.join(" ");
	if (normalizedTitle === normalizedQuery) score += BONUS_TITLE_MATCH;
	else if (normalizedTitle.startsWith(normalizedQuery)) score += BONUS_TITLE_STARTS_WITH;
	if (found === queryTokens.length) score += BONUS_COVERING;

	return score;
}


function scoreMusic(music: Music, query: string) {
	return scoreFields(music.name, [
		{ value: music.name, boost: 3 },
		{ value: music.artists.map((artist) => artist.name).join(" "), boost: 2 },
		{ value: music.album?.name ?? "", boost: 1 },
	], query);
}

function scoreAlbum(album: Album, query: string) {
	return scoreFields(album.name, [
		{ value: album.name, boost: 3 },
		{ value: album.artists.map((artist) => artist.name).join(" "), boost: 2 },
	], query);
}

function scoreArtist(artist: Artist, query: string) {
	return scoreFields(artist.name, [
		{ value: artist.name, boost: 1 },
	], query);
}

function sortByScore<T>(items: T[], score: (item: T) => number) {
	return items.map((item) => ({ item, score: score(item) }))
		.sort((a, b) => b.score - a.score)
		.map(({ item }) => item);
}

export default function Search() {
	const params = useParams<{ search: string }>();
	const profileQuery = useMeProfileQuery();

	const providers = () => profileQuery.data?.body.connectedProviders ?? [];
	const search = () => decodeURIComponent(params.search ?? "");
	const searches = useProvidersSearchQueries(providers, search);

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
			organizedData.best = {
				item: organizedData.musics[0],
				providerName: organizedData.providers.find((p) => p.uuid === organizedData.musics[0].providerUuid)?.name ?? "",
			};
		} else if (bestScores.albums > bestScores.artists) {
			organizedData.best = {
				item: organizedData.albums[0],
				providerName: organizedData.providers.find((p) => p.uuid === organizedData.albums[0].providerUuid)?.name ?? "",
			};
		} else if (bestScores.artists > 0) {
			organizedData.best = {
				item: organizedData.artists[0],
				providerName: organizedData.providers.find((p) => p.uuid === organizedData.artists[0].providerUuid)?.name ?? "",
			};
		}

		return organizedData;
	});

	const [searchParams, setSearchParams] = useSearchParams<{ tab?: Tab }>();
	const tab = () => searchParams.tab ?? "All";

	let tabsNav!: HTMLElement;
	const updateTabIndicator = () => {
		const selected = tabsNav.querySelector<HTMLElement>("[aria-selected=true]");
		tabsNav.style.setProperty("--indicator-left", `${selected?.offsetLeft ?? 0}px`);
		tabsNav.style.setProperty("--indicator-width", `${selected?.offsetWidth ?? 0}px`);
	};
	createEffect(on(tab, updateTabIndicator));
	onMount(() => {
		const observer = new ResizeObserver(updateTabIndicator);
		observer.observe(tabsNav);
		onCleanup(() => observer.disconnect());
	});

	return <div class="page" id="provider">
		<nav class="search-tabs" role="tablist" ref={tabsNav}>
			<For each={TABS}>
				{(t) => <Button
					type="button"
					role="tab"
					variant="text"
					aria-selected={tab() === t}
					classList={{ active: tab() === t }}
					onClick={() => setSearchParams({ tab: t }, { replace: true })}
				>
					{t}
				</Button>}
			</For>
		</nav>
		<Switch>
			<Match when={tab() === "All"}>
				<BestResult best={results().best} />
				<Show when={results().musics.length > 0}>
					<section class="musics">
						<h2>Musics</h2>
						<MusicSection music={{ musics: results().musics.slice(0, 6), total: results().musics.length }} />
						<A href={`/search/${encodeURIComponent(search())}?tab=Musics`} class="white-variant see-more">See more</A>
					</section>
				</Show>
				<Show when={results().albums.length > 0}>
					<section class="albums">
						<h2>Albums</h2>
						<AlbumSection album={{ albums: results().albums.slice(0, 6), total: results().albums.length }} />
						<A href={`/search/${encodeURIComponent(search())}?tab=Albums`} class="white-variant see-more">See more</A>
					</section>
				</Show>
				<Show when={results().artists.length > 0}>
					<section class="artists">
						<h2>Artists</h2>
						<ArtistSection artist={{ artists: results().artists.slice(0, 6), total: results().artists.length }} />
						<A href={`/search/${encodeURIComponent(search())}?tab=Artists`} class="white-variant see-more">See more</A>
					</section>
				</Show>
				<NoResult show={results().musics.length + results().albums.length + results().artists.length === 0} />
			</Match>
			<Match when={tab() === "Musics"}>
				<Show when={results().musics.length > 0}>
					<section class="musics">
						<h2>Musics</h2>
						<MusicSection music={{ musics: results().musics, total: results().musics.length }} />
					</section>
				</Show>
				<NoResult show={results().musics.length === 0} />
			</Match>
			<Match when={tab() === "Albums"}>
				<Show when={results().albums.length > 0}>
					<section class="albums">
						<h2>Albums</h2>
						<AlbumSection album={{ albums: results().albums, total: results().albums.length }} />
					</section>
				</Show>
				<NoResult show={results().albums.length === 0} />
			</Match>
			<Match when={tab() === "Artists"}>
				<Show when={results().artists.length > 0}>
					<section class="artists">
						<h2>Artists</h2>
						<ArtistSection artist={{ artists: results().artists, total: results().artists.length }} />
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
