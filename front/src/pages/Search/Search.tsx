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

const TABS = ["all", "musics", "albums", "artists", "playlists", "users", "providers"] as const;
export type Tab = typeof TABS[number];

export default function Provider() {
	const navigate = useNavigate();
	const params = useParams<{ search: string }>();
	const profileQuery = useMeProfileQuery();

	const providers = () => profileQuery.data?.body.connectedProviders ?? [];
	const searches = useProvidersSearchQueries(providers, () => params.search);

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
			albums: data.flatMap((d) => d.albums.map((album) => ({ ...album, provider: d.provider }))),
			artists: data.flatMap((d) => d.artists.map((artist) => ({ ...artist, provider: d.provider }))),
			providers: (data.filter((d) => d.musics.length + d.albums.length + d.artists.length > 0 || d.provider.name.toLocaleLowerCase().includes(params.search.toLowerCase()))).map((d) => d.provider),
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
				<p>albums</p>
				<code>
					{JSON.stringify(results().albums, null, 2)}
				</code>
			</Match>
			<Match when={tab() === "artists"}>
				<p>artists</p>
				<code>
					{JSON.stringify(results().artists, null, 2)}
				</code>
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
