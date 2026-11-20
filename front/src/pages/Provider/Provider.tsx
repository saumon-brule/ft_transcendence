import { useSearchParams } from "@solidjs/router";
import { createMemo, Match, Show, Switch } from "solid-js";
import { useProvider } from "~/components/guards/ProviderInfoGuard";
import { ProviderError, useProviderInfoQuery } from "~/api/queryHooks/providerInfo";
import ProviderHeader from "./ProviderHeader";
import "./Provider.scss";
import { useTabParam } from "~/components/ui/Tabs/useTabParam";
import Tabs from "~/components/ui/Tabs/Tabs";
import ProviderTabAll from "./ProviderTabs/ProviderTabAll";
import ProviderTabMusics from "./ProviderTabs/ProviderTabMusics";
import ProviderTabAlbums from "./ProviderTabs/ProviderTabAlbums";
import ProviderTabArtists from "./ProviderTabs/ProviderTabArtists";
import OfflineProvider from "~/components/ui/NoResult/OfflineProvider";
import ProviderSearchBar from "./ProviderSearchBar";
import LoadingSplash from "../Loading/LoadingSplash";

const TABS = ["All", "Musics", "Albums", "Artists"] as const;
type Tab = typeof TABS[number];
export type ProviderStatus = "loading" | "success" | "forbidden" | "offline";

export default function Provider() {
	const provider = useProvider();
	const providerInfoQuery = useProviderInfoQuery(() => provider);
	const providerStatus = createMemo<ProviderStatus>(() => {
		if (providerInfoQuery.isSuccess) return "success";
		if (providerInfoQuery.isError) {
			const err = providerInfoQuery.error;
			return err instanceof ProviderError && err.code === "FORBIDDEN" ? "forbidden" : "offline";
		}
		return "loading";
	});

	const [tab, setTab] = useTabParam<Tab>(TABS, "All");
	const [searchParams, setSearchParams] = useSearchParams<{ q?: string }>();
	const search = () => decodeURIComponent(searchParams.q ?? "");
	const setSearch = (value: string) => setSearchParams({ q: encodeURIComponent(value) || undefined }, { replace: true });

	return <div class="page" id="provider">
		<ProviderHeader provider={providerInfoQuery.data?.body} status={providerStatus()} />
		<Switch>
			<Match when={providerStatus() === "loading"}>
				<LoadingSplash />
			</Match>
			<Match when={providerStatus() === "forbidden"}>
				<div class="error">You don't have access to this provider</div>
			</Match>
			<Match when={providerStatus() === "offline"}>
				<OfflineProvider show={true}/>
			</Match>
			<Match when={providerStatus() === "success"}>
				<Show when={providerInfoQuery.data?.body}>
					<Tabs tabs={TABS} value={tab()} onChange={setTab} />
					<ProviderSearchBar value={search()} onSearch={setSearch} />
					<Switch>
						<Match when={tab() === "All"}>
							<ProviderTabAll search={search()} />
						</Match>
						<Match when={tab() === "Musics"}>
							<ProviderTabMusics search={search()} />
						</Match>
						<Match when={tab() === "Albums"}>
							<ProviderTabAlbums search={search()} />
						</Match>
						<Match when={tab() === "Artists"}>
							<ProviderTabArtists search={search()} />
						</Match>
					</Switch>
				</Show>
			</Match>
		</Switch>
	</div>;
}
