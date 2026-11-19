import type { ProviderDataDto, Provider } from "@flex/shared";
import { Show } from "solid-js";
type ProviderHeaderProps = {
	providerInfo: ProviderDataDto | undefined;
	provider: Provider;
};

export default function ProviderEditHeader(props: ProviderHeaderProps) {
	return <header class="provider-header">
		<div class="content">
			<div class="provider-header-title">
				<h2>{props.provider.name}</h2>
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
