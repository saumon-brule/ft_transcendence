import { useParams, useNavigate, useSearchParams } from "@solidjs/router";
import { createEffect, createMemo, Match, Show, Switch } from "solid-js";
import { summonErrorToast } from "~/components/ui/Toaster";
import { client, queryKeys } from "~/api/client";
import { ProviderError, useProviderInfoQuery } from "~/api/queryHooks/providerInfo";
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
import LoadingSplash from "../Loading/LoadingSplash";

const TABS = ["All", "Musics", "Albums", "Artists"] as const;
type Tab = typeof TABS[number];
export type ProviderStatus = "loading" | "success" | "forbidden" | "offline";

export default function Provider() {
	const navigate = useNavigate();
	const params = useParams<{ uuid: string }>();
	const providerBack = client.providers.get.createQuery(() => queryKeys.providers.get([params.uuid]), { params: { get uuid() { return params.uuid; } } });
	const providerInfo = () => providerBack.data?.body ?? null;
	const provider = useProviderInfoQuery(() => params.uuid, providerInfo);
	const providerStatus = createMemo<ProviderStatus>(() => {
		if (provider.isSuccess) return "success";
		if (provider.isError) {
			const err = provider.error;
			return err instanceof ProviderError && err.code === "FORBIDDEN" ? "forbidden" : "offline";
		}
		return "loading";
	});

	createEffect(() => {
		if (providerBack.isError) {
			navigate("/home");
			summonErrorToast("Unknown provider");
		}
	});

	const [tab, setTab] = useTabParam<Tab>(TABS, "All");
	const [searchParams, setSearchParams] = useSearchParams<{ q?: string }>();
	const search = () => decodeURIComponent(searchParams.q ?? "");
	const setSearch = (value: string) => setSearchParams({ q: encodeURIComponent(value) || undefined }, { replace: true });

	return <div class="page" id="provider">
		<Show when={providerInfo()} keyed>{(backData) => <>
			<ProviderHeader provider={provider.data?.body} providerBack={backData} status={providerStatus()} />
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
					<Show when={provider.data?.body}>
						<Tabs tabs={TABS} value={tab()} onChange={setTab} />
						<ProviderSearchBar value={search()} onSearch={setSearch} />
						<Switch>
							<Match when={tab() === "All"}>
								<ProviderTabAll providerInfo={backData} search={search()} />
							</Match>
							<Match when={tab() === "Musics"}>
								<ProviderTabMusics providerInfo={backData} search={search()} />
							</Match>
							<Match when={tab() === "Albums"}>
								<ProviderTabAlbums providerUrl={backData.address} providerUuid={params.uuid} search={search()} />
							</Match>
							<Match when={tab() === "Artists"}>
								<ProviderTabArtists providerUrl={backData.address} providerUuid={params.uuid} search={search()} />
							</Match>
						</Switch>
					</Show>
				</Match>
			</Switch>
		</>}</Show>
	</div>;
}
