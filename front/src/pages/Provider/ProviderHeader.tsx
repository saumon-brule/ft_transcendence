import type { ProviderDataDto, Provider } from "@flex/shared";
import { Show } from "solid-js";

export default function ProviderHeader(props: { provider: ProviderDataDto | undefined; providerBack: Provider }) {
	return <header class="provider-header">
		<h2>{props.providerBack.name}</h2>
		<Show when={props.provider}>{(provider) => <>
			<div class="header-info-items">
				<span class="stat">{provider().music.total} musics</span>
				<div class="separator"/>
				<span class="stat">{provider().artist.total} artists</span>
				<div class="separator"/>
				<span class="stat">{provider().album.total} albums</span>
			</div>
		</>}</Show>
	</header>;
}
