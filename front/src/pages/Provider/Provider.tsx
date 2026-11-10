import { useParams, useNavigate, useSearchParams } from "@solidjs/router";
import { createEffect, Match, Show, Switch } from "solid-js";
import { summonErrorToast } from "~/components/ui/Toaster";
import { client, queryKeys } from "~/api/client";
import { useProviderInfoQuery } from "~/api/queryHooks/providerInfo";
import ProviderHeader from "./ProviderHeader";
import "./Provider.scss";
import { useTabParam } from "~/components/ui/Tabs/useTabParam";
import Tabs from "~/components/ui/Tabs/Tabs";
import ProviderTabAll from "./ProviderTabAll";
import ProviderTabMusics from "./ProviderTabMusics";
import ProviderTabAlbums from "./ProviderTabAlbums";
import ProviderTabArtists from "./ProviderTabArtists";
import OfflineProvider from "~/components/ui/NoResult/OfflineProvider";
import ProviderSearchBar from "./ProviderSearchBar";

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
	const [searchParams, setSearchParams] = useSearchParams<{ q?: string }>();
	const search = () => searchParams.q ?? "";
	const setSearch = (value: string) => setSearchParams({ q: encodeURIComponent(value) || undefined }, { replace: true });

	return <div class="page" id="provider">
		<Show when={providerBack.data?.body} keyed>{(backData) => <>
			<ProviderHeader provider={provider.data?.body} providerBack={backData} />
			<OfflineProvider show={provider.isError} />
			<Show when={provider.data?.body}>
				<Tabs tabs={TABS} value={tab()} onChange={setTab} />
				<ProviderSearchBar value={search()} onSearch={setSearch} />
				<Switch>
					<Match when={tab() === "All"}>
						<ProviderTabAll providerUrl={backData.address} providerUuid={params.uuid} search={search()} />
					</Match>
					<Match when={tab() === "Musics"}>
						<ProviderTabMusics providerUrl={backData.address} providerUuid={params.uuid} search={search()} />
					</Match>
					<Match when={tab() === "Albums"}>
						<ProviderTabAlbums providerUrl={backData.address} providerUuid={params.uuid} search={search()} />
					</Match>
					<Match when={tab() === "Artists"}>
						<ProviderTabArtists providerUrl={backData.address} providerUuid={params.uuid} search={search()} />
					</Match>
				</Switch>
			</Show>
		</>}</Show>
	</div>;
}
