import { useParams, useNavigate, useSearchParams } from "@solidjs/router";
import { createEffect, createMemo, Match, Show, Switch } from "solid-js";
import { summonErrorToast } from "~/components/ui/Toaster";
import { client, queryKeys } from "~/api/client";
import { useProviderInfoQuery, useProvidersSearchQueries } from "~/api/queryHooks/providerInfo";
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

const TABS = ["all", "musics", "albums", "artists", "playlists", "users", "providers"] as const;
export type Tab = typeof TABS[number];

// const TABLES: Record<SearchTable, { from: Prisma.Sql; fields: SearchField[] }> = {
// 	Music: { from: Prisma.raw("\"Music\""), fields: [field("name", 3), field("searchArtists", 2), field("searchAlbum", 1)] },
// 	Artist: { from: Prisma.raw("\"Artist\""), fields: [field("name", 1)] },
// 	Album: { from: Prisma.raw("\"Album\""), fields: [field("name", 3), field("searchArtists", 2)] },
// };

const MIN_FUZZY_LENGTH = 3;
const tokensOf = (value: string) => value.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
const POINTS_EXACT = 1.0;
const POINTS_PREFIX = 0.8;
const POINTS_FUZZY = 0.5;

const BONUS_TITLE_MATCH = 5;
const BONUS_TITLE_STARTS_WITH = 2;
const BONUS_COVERING = 1;
const MALUS_WORD_NOT_FOUND = -1;

function scoreMusic(music: Music, query: string) {

}

function scoreAlbum(album: Album, query: string) {

}

function scoreArtist(artist: Artist, query: string) {

}


export default function Provider() {
	const navigate = useNavigate();
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

		const organizedData = {
			musics: data.flatMap((d) => d.musics),
			albums: data.flatMap((d) => d.albums),
			artists: data.flatMap((d) => d.artists),
			providers: (data.filter((d) => d.musics.length + d.albums.length + d.artists.length > 0 || d.provider.name.toLocaleLowerCase().includes(search().toLowerCase()))).map((d) => d.provider),
		}

		return organizedData;
	});

	const [searchParams, setSearchParams] = useSearchParams<{ tab?: Tab }>();
	const tab = () => searchParams.tab ?? "all";

	createEffect(() => {
		
	});

	return <div class="page" id="provider">
		<nav class="search-tabs" role="tablist">
			<For each={TABS}>
				{(t) => <Button
					type="button"
					role="tab"
					aria-selected={tab() === t}
					classList={{ active: tab() === t }}
					onClick={() => setSearchParams({ tab: t }, { replace: true })}
				>
					{t}
				</Button>}
			</For>
		</nav>
		<Switch>
			<Match when={tab() === "all"}>
				<p>mettre le top pertinence truc</p>
				<code>{JSON.stringify(results(), null, 2)}</code>
			</Match>
			<Match when={tab() === "musics"}>
				<section class="musics">
					<h2>Musics</h2>
					<MusicSection music={{ musics: results().musics, total: results().musics.length }} />
				</section>
			</Match>
			<Match when={tab() === "albums"}>
				<section class="albums">
					<h2>Albums</h2>
					<AlbumSection album={{ albums: results().albums, total: results().albums.length }} />
				</section>
			</Match>
			<Match when={tab() === "artists"}>
				<section class="artists">
					<h2>Artists</h2>
					<ArtistSection artist={{ artists: results().artists, total: results().artists.length }} />
				</section>
			</Match>
			<Match when={tab() === "playlists"}>
				<p>Comming soon</p>
			</Match>
			<Match when={tab() === "users"}>
				<p>Comming soon</p>
			</Match>
			<Match when={tab() === "providers"}>
				<p>Providers</p>
				<code>
					{JSON.stringify(results().providers, null, 2)}
				</code>
			</Match>
		</Switch>
	</div>;
}
