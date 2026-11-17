import { useParams, useNavigate, useSearchParams } from "@solidjs/router";
import { createEffect, createMemo, Match, Show, Switch } from "solid-js";
import { summonErrorToast } from "~/components/ui/Toaster";
import { client, queryKeys } from "~/api/client";
import { useProviderInfoQuery } from "~/api/queryHooks/providerInfo";
import ProviderHeader from "./ProviderHeader";
import "./Provider.scss";
import { useTabParam } from "~/components/ui/Tabs/useTabParam";
import Tabs from "~/components/ui/Tabs/Tabs";
import ProviderSearchBar from "./ProviderSearchBar";
import LoadingSplash from "../Loading/LoadingSplash";
import { useProviderInfoInfoQuery } from "~/api/queryHooks/providerAccess";

const TABS = ["Music", "Albums", "Artists", "Members", "Roles"] as const;
type Tab = typeof TABS[number];
export type ProviderStatus = "loading" | "success";

export default function ProviderEdit() {
	const navigate = useNavigate();
	const params = useParams<{ uuid: string }>();
	const providerQuery = client.providers.get.createQuery(() => queryKeys.providers.get([params.uuid]), { params: { get uuid() { return params.uuid; } } });
	const provider = () => providerQuery.data?.body ?? null;
	const providerInfoQuery = useProviderInfoQuery(() => params.uuid, provider);
	const providerInfoInfoQuery = createMemo(() => {
		const tmp = provider();
		if (tmp) useProviderInfoInfoQuery(() => tmp);
		else return null;
	});
	const providerStatus = createMemo<ProviderStatus>(() => {
		if (providerInfoQuery.isSuccess) return "success";
		if (providerInfoQuery.isError) {
			navigate(`/provider/${provider()?.uuid}`);
		}
		return "loading";
	});

	createEffect(() => {
		if (providerQuery.isError) {
			navigate("/home");
			summonErrorToast("Unknown provider");
		}
	});

	const [tab, setTab] = useTabParam<Tab>(TABS, "Music");
	const [searchParams, setSearchParams] = useSearchParams<{ q?: string }>();
	const search = () => decodeURIComponent(searchParams.q ?? "");
	const setSearch = (value: string) => setSearchParams({ q: encodeURIComponent(value) || undefined }, { replace: true });

	return <div class="page" id="provider">
		<Show when={provider()} keyed>{(backData) => <>
			<ProviderHeader provider={providerInfoQuery.data?.body} providerBack={backData} status={providerStatus()} />
			<Switch>
				<Match when={providerStatus() === "loading"}>
					<LoadingSplash />
				</Match>
				<Match when={providerStatus() === "success"}>
					<Show when={providerInfoQuery.data?.body}>
						<Tabs tabs={TABS} value={tab()} onChange={setTab} />
						<ProviderSearchBar value={search()} onSearch={setSearch} />
						<Switch>
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
