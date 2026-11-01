import type { ProviderDataDto, Provider } from "@flex/shared";

export default function ProviderHeader(props: { provider: ProviderDataDto; providerBack: Provider }) {
	return <header class="provider-header">
		<h2>{props.providerBack.name}</h2>
		<div class="header-info-itemS">
			<span class="stat">{props.provider.music.total} musics</span>
			<div class="separator"/>
			<span class="stat">{props.provider.artist.total} artists</span>
			<div class="separator"/>
			<span class="stat">{props.provider.album.total} albums</span>
		</div>
	</header>;
}
