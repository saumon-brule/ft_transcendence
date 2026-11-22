import { useSearchParams } from "@solidjs/router";
import { createMemo, Match, Show, Switch } from "solid-js";
import { useProviderInfoQuery } from "~/api/queryHooks/providerInfo";
import { useTabParam } from "~/components/ui/Tabs/useTabParam";
import Tabs from "~/components/ui/Tabs/Tabs";
import ProviderSearchBar from "../ProviderSearchBar";
import LoadingSplash from "../../Loading/LoadingSplash";
import { useProviderInfoInfo } from "~/components/guards/EditPermissionGuard";
import { ManageMembers } from "../ProviderEditTabs/ManageMembers";
import { useProvider } from "~/components/guards/ProviderInfoGuard";
import ProviderEditHeader from "../ProviderEditHeader";
import { summonUploadMusicPopUp } from "../popUps/summonAddMusicPopUp";
import Button from "~/components/inputs/Button";
import { Plus } from "lucide-solid";
import "./ProviderEdit.scss";
import { ManageRoles } from "../ProviderEditTabs/ManageRoles";
import { ProviderPermission } from "@flex/shared";
import { summonAddRolePopUp } from "../popUps/summonAddRolePopUp";
import { summonAddArtistPopUp } from "../popUps/summonAddArtistPopUp";
import { summonAddAlbumPopUp } from "../popUps/summonAddAlbumPopUp";
import { ManageArtists } from "../ProviderEditTabs/ManageArtists";
import { ManageAlbums } from "../ProviderEditTabs/ManageAlbums";
import { ManageMusics } from "../ProviderEditTabs/ManageMusics";
import { useTranslation } from "~/i18n/context";

const TABS = ["Musics", "Albums", "Artists", "Members", "Roles"] as const;
type Tab = typeof TABS[number];
export type ProviderStatus = "loading" | "success";


export default function ProviderEdit() {
	const { t } = useTranslation();
	const provider = useProvider();
	const providerInfoInfo = useProviderInfoInfo();
	const providerInfoQuery = useProviderInfoQuery(() => provider);
	const permissions = () => providerInfoInfo.member.permissions;

	const [tab, setTab] = useTabParam<Tab>(TABS, permissions().includes("MANAGE_CATALOG") ? "Musics" : permissions().includes("MANAGE_MEMBERS") ? "Members" : "Roles");
	const [searchParams, setSearchParams] = useSearchParams<{ q?: string }>();
	const search = () => decodeURIComponent(searchParams.q ?? "");
	const setSearch = (value: string) => setSearchParams({ q: encodeURIComponent(value) || undefined }, { replace: true });

	let fileInputRef!: HTMLInputElement;

	function hasPerm(perm: ProviderPermission) {
		return providerInfoInfo.member.isOwner || providerInfoInfo.member.permissions.includes(perm);
	}

	const tabExclude = createMemo(() => {
		let include: Tab[] = [];
		if (hasPerm("MANAGE_CATALOG")) include = [...include, "Albums", "Artists", "Musics"];
		if (hasPerm("MANAGE_MEMBERS")) include = [...include, "Members"];
		if (hasPerm("ADMIN")) include = [...include, "Roles"];
		return TABS.filter((tab) => !include.includes(tab));
	});

	return <div class="page" id="provider-edit">
		<ProviderEditHeader providerInfo={providerInfoQuery.data?.body} />
		<Show when={providerInfoQuery.data?.body} fallback={<LoadingSplash/>}>
			<Tabs tabs={TABS} value={tab()} exclude={tabExclude()} onChange={setTab} label={(tab) => t(`common.tabs.${tab}`)} />
			<div class="provider-controls">
				<ProviderSearchBar value={search()} onSearch={setSearch} />
				<Switch>
					<Match when={hasPerm("MANAGE_CATALOG") && tab() === "Musics"}>
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
						<Button onClick={() => fileInputRef.click()}><Plus/>{t("pages.provider.edit.addMusic")}</Button>
					</Match>
					<Match when={hasPerm("MANAGE_CATALOG") && tab() === "Albums"}>
						<Button onClick={() => summonAddAlbumPopUp(provider)}><Plus/>{t("pages.provider.edit.addAlbum")}</Button>
					</Match>
					<Match when={hasPerm("MANAGE_CATALOG") && tab() === "Artists"}>
						<Button onClick={() => summonAddArtistPopUp(provider)}><Plus/>{t("pages.provider.edit.addArtist")}</Button>
					</Match>
					<Match when={hasPerm("ADMIN") && tab() == "Roles"}>
						<Button onClick={() => summonAddRolePopUp(provider)}><Plus/>{t("pages.provider.edit.addRole")}</Button>
					</Match>
				</Switch>
			</div>
			<Switch>
				<Match when={hasPerm("MANAGE_CATALOG") && tab() === "Musics"}>
					<ManageMusics search={search()}/>
				</Match>
				<Match when={hasPerm("MANAGE_CATALOG") && tab() === "Albums"}>
					<ManageAlbums search={search()}/>
				</Match>
				<Match when={hasPerm("MANAGE_CATALOG") && tab() === "Artists"}>
					<ManageArtists search={search()}/>
				</Match>
				<Match when={hasPerm("MANAGE_MEMBERS") && tab() === "Members"}>
					<ManageMembers search={search()}/>
				</Match>
				<Match when={hasPerm("ADMIN") && tab() === "Roles"}>
					<ManageRoles search={search()}/>
				</Match>
			</Switch>
		</Show>
	</div>;
}
