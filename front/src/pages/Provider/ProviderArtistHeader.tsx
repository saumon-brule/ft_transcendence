import type { ArtistDetailedItemDto, Provider } from "@flex/shared";
import { Show } from "solid-js";
import { useMediaToken } from "~/api/providerClients";
import { buildMediaUrl } from "@flex/shared";
import { A } from "@solidjs/router";

export default function ProviderArtistHeader(props: { artist: ArtistDetailedItemDto; providerBack: Provider }) {
	const mediaToken = useMediaToken(() => props.providerBack.address);

	function getAvatar(artist: ArtistDetailedItemDto) {
		const token = mediaToken();
		if (artist.hasAvatar && token) {
			return buildMediaUrl(props.providerBack.address, "artistAvatar", artist.uuid, token);
		}
		return "/images/default_artist.png";
	}

	return <header class="provider-image-header">
		<img src={getAvatar(props.artist)} alt="Profile picture" />
		<div class="header-info">
			<h2>{props.artist.name}</h2>
			<div class="stats">
				<div class="stat">{props.artist.music.total} tracks</div>
				<div class="separator" />
				<div class="stat">{props.artist.album.total} albums</div>
			</div>
			<Show when={props.artist.biography}>
				<p class="bio">{props.artist.biography}</p>
			</Show>
			<p>From <A href={`/provider/${props.providerBack.uuid}`}>{props.providerBack.name}</A></p>
		</div>
	</header>;
}
