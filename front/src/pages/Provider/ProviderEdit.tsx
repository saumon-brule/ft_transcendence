import { useParams, useNavigate, useSearchParams } from "@solidjs/router";
import { createMemo, Match, Show, Switch } from "solid-js";
import { client, queryKeys } from "~/api/client";
import { useProviderInfoQuery } from "~/api/queryHooks/providerInfo";
import ProviderHeader from "./ProviderHeader";
import { useTabParam } from "~/components/ui/Tabs/useTabParam";
import Tabs from "~/components/ui/Tabs/Tabs";
import ProviderSearchBar from "./ProviderSearchBar";
import LoadingSplash from "../Loading/LoadingSplash";
import "./Provider.scss";
import { useProviderInfoInfo } from "~/components/guards/EditPermissionGuard";

const TABS = ["Musics", "Albums", "Artists", "Members", "Roles"] as const;
type Tab = typeof TABS[number];
export type ProviderStatus = "loading" | "success";

export default function ProviderEdit() {
	const navigate = useNavigate();
	const params = useParams<{ uuid: string }>();
	const providerQuery = client.providers.get.createQuery(() => queryKeys.providers.get([params.uuid]), { params: { get uuid() { return params.uuid; } } });
	const provider = () => providerQuery.data?.body ?? null;
	const providerInfoQuery = useProviderInfoQuery(() => params.uuid, provider);
	const providerInfoInfo = useProviderInfoInfo();
	const providerStatus = createMemo<ProviderStatus>(() => {
		if (providerInfoQuery.isSuccess) return "success";
		if (providerInfoQuery.isError) {
			navigate(`/provider/${provider()?.uuid}`);
		}
		return "loading";
	});

	const permissions = () => providerInfoInfo.member.permissions;

	const [tab, setTab] = useTabParam<Tab>(TABS, permissions().includes("MANAGE_CATALOG") ? "Musics" : permissions().includes("MANAGE_MEMBERS") ? "Members" : "Roles");
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
							<Show when={permissions().includes("MANAGE_CATALOG")}>
								<Match when={tab() === "Musics"}>
									<div>musics</div>
								</Match>
								<Match when={tab() === "Albums"}>
									<div>albuims</div>
								</Match>
								<Match when={tab() === "Artists"}>
									<div>artits</div>
								</Match>
							</Show>
							<Show when={permissions().includes("MANAGE_MEMBERS")}>
								<Match when={tab() === "Members"}>
									<div>members</div>
								</Match>
							</Show>
							<Show when={permissions().includes("ADMIN")}>
								<Match when={tab() === "Roles"}>
									<div>roles</div>
								</Match>
							</Show>
						</Switch>
					</Show>
				</Match>
			</Switch>
		</>}</Show>
	</div>;
}
