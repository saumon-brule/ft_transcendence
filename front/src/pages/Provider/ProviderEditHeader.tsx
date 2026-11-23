import type { ProviderDataDto } from "@flex/shared";
import { createSignal, Show } from "solid-js";
import { providerUpdateSettings } from "~/api/queryHooks/providerSettings";
import { useProviderInfoInfo } from "~/components/guards/EditPermissionGuard";
import { useProvider } from "~/components/guards/ProviderInfoGuard";
import Button from "~/components/inputs/Button";
import { useTranslation } from "~/i18n/context";
type ProviderHeaderProps = {
	providerInfo: ProviderDataDto | undefined;
};

export default function ProviderEditHeader(props: ProviderHeaderProps) {
	const { t } = useTranslation();
	const provider = useProvider();
	const providerInfo = useProviderInfoInfo();

	const [disableSetVisibility, setDisableSetVisibility] = createSignal(false);

	async function setVisibility(visibility: boolean) {
		setDisableSetVisibility(true);
		await providerUpdateSettings(provider, visibility ? "PUBLIC" : "PRIVATE");
		setDisableSetVisibility(false);
	}

	return <header class="provider-header">
		<div class="content">
			<div class="provider-header-title">
				<h2>{provider.name}</h2>
			</div>
			<Show when={props.providerInfo}>{(provider) => <>
				<div class="header-info-items">
					<span class="stat">{t("pages.provider.stats.musics", { count: String(provider().music.total) })}</span>
					<div class="separator"/>
					<span class="stat">{t("pages.provider.stats.artists", { count: String(provider().artist.total) })}</span>
					<div class="separator"/>
					<span class="stat">{t("pages.provider.stats.albums", { count: String(provider().album.total) })}</span>
				</div>
			</>}</Show>
		</div>
		<Show when={providerInfo.member.isOwner}>
			<Show when={providerInfo.visibility === "PRIVATE"}>
				<Button disabled={disableSetVisibility()} onClick={() => void setVisibility(true)}>{t("pages.provider.edit.setPublic")}</Button>
			</Show>
			<Show when={providerInfo.visibility === "PUBLIC"}>
				<Button disabled={disableSetVisibility()} onClick={() => void setVisibility(false)}>{t("pages.provider.edit.setPrivate")}</Button>
			</Show>
		</Show>
	</header>;
}
