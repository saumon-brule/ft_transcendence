import type { ProviderDataDto } from "@flex/shared";
import { Show } from "solid-js";
import { useProvider } from "~/components/guards/ProviderInfoGuard";
type ProviderHeaderProps = {
	providerInfo: ProviderDataDto | undefined;
};

export default function ProviderEditHeader(props: ProviderHeaderProps) {
	const provider = useProvider();

	return <header class="provider-header">
		<div class="content">
			<div class="provider-header-title">
				<h2>{provider.name}</h2>
			</div>
			<Show when={props.providerInfo}>{(provider) => <>
				<div class="header-info-items">
					<span class="stat">{provider().music.total} musics</span>
					<div class="separator"/>
					<span class="stat">{provider().artist.total} artists</span>
					<div class="separator"/>
					<span class="stat">{provider().album.total} albums</span>
				</div>
			</>}</Show>
		</div>
	</header>;
}
