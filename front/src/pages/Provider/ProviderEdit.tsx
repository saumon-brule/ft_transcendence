import { useSearchParams } from "@solidjs/router";
import { Match, Show, Switch } from "solid-js";
import { useProviderInfoQuery } from "~/api/queryHooks/providerInfo";
import { useTabParam } from "~/components/ui/Tabs/useTabParam";
import Tabs from "~/components/ui/Tabs/Tabs";
import ProviderSearchBar from "./ProviderSearchBar";
import LoadingSplash from "../Loading/LoadingSplash";
import { useProviderInfoInfo } from "~/components/guards/EditPermissionGuard";
import { ManageMembers } from "./ProviderEditTabs/ManageMembers";
import { useProvider } from "~/components/guards/ProviderInfoGuard";
import ProviderEditHeader from "./ProviderEditHeader";

import { summonUploadMusicPopUp } from "./popUps/summonAddMusicPopUp";
import Button from "~/components/inputs/Button";
import { Plus } from "lucide-solid";
import "./ProviderEdit.scss";

const TABS = ["Musics", "Albums", "Artists", "Members", "Roles"] as const;
type Tab = typeof TABS[number];
export type ProviderStatus = "loading" | "success";


export default function ProviderEdit() {
	const provider = useProvider();
	const providerInfoInfo = useProviderInfoInfo();
	const providerInfoQuery = useProviderInfoQuery(() => provider.uuid, () => provider);
	const permissions = () => providerInfoInfo.member.permissions;

	const [tab, setTab] = useTabParam<Tab>(TABS, permissions().includes("MANAGE_CATALOG") ? "Musics" : permissions().includes("MANAGE_MEMBERS") ? "Members" : "Roles");
	const [searchParams, setSearchParams] = useSearchParams<{ q?: string }>();
	const search = () => decodeURIComponent(searchParams.q ?? "");
	const setSearch = (value: string) => setSearchParams({ q: encodeURIComponent(value) || undefined }, { replace: true });

	let fileInputRef!: HTMLInputElement;

	return <div class="page" id="provider-edit">
		<ProviderEditHeader providerInfo={providerInfoQuery.data?.body} provider={provider} />
		<Show when={providerInfoQuery.data?.body} fallback={<LoadingSplash/>}>
			<Tabs tabs={TABS} value={tab()} onChange={setTab} />
			<div class="provider-controls">
				<ProviderSearchBar value={search()} onSearch={setSearch} />
				<Show when={providerInfoInfo.member.isOwner || providerInfoInfo.member.permissions.includes("MANAGE_CATALOG")}>
					<input
						ref={fileInputRef}
						type="file"
						accept="audio/*"
						style={{ display: "none" }}
						onChange={(e) => {
							const file = e.currentTarget.files?.[0];
							if (!file) return;
							void summonUploadMusicPopUp(file, provider);
						}}
					/>
					<Button onClick={() => fileInputRef.click()}><Plus/>Add Music</Button>
				</Show>
			</div>
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
						<ManageMembers search={search()}/>
					</Match>
				</Show>
				<Show when={permissions().includes("ADMIN")}>
					<Match when={tab() === "Roles"}>
						<div>roles</div>
					</Match>
				</Show>
			</Switch>
		</Show>
	</div>;
}
