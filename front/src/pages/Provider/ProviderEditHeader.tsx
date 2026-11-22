import type { ProviderDataDto } from "@flex/shared";
import { Show } from "solid-js";
import { useProvider } from "~/components/guards/ProviderInfoGuard";
import { useTranslation } from "~/i18n/context";
type ProviderHeaderProps = {
	providerInfo: ProviderDataDto | undefined;
};

export default function ProviderEditHeader(props: ProviderHeaderProps) {
	const { t } = useTranslation();
	const provider = useProvider();

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
	</header>;
}
