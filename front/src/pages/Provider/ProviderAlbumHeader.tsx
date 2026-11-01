import type { AlbumDetailedItemDto, Provider } from "@flex/shared";
import { Show } from "solid-js";
import { useMediaToken } from "~/api/providerClients";
import { buildMediaUrl } from "@flex/shared";
import { A } from "@solidjs/router";

export default function ProviderAlbumHeader(props: { album: AlbumDetailedItemDto; providerBack: Provider }) {
	const mediaToken = useMediaToken(() => props.providerBack.address);

	function getCover(album: AlbumDetailedItemDto) {
		const token = mediaToken();
		if (album.hasCover && token) {
			return buildMediaUrl(props.providerBack.address, "albumCover", album.uuid, token);
		}
		return "/images/default_album.png";
	}

	return <header class="provider-image-header">
		<img src={getCover(props.album)} alt="Profile picture" />
		<div class="header-info">
			<h2>{props.album.name}</h2>
			<div class="stats">
				<div class="stat">{props.album.music.total} tracks</div>
				<div class="separator" />
				<div class="stat">{props.album.artists.length} artists</div>
			</div>
			<Show when={props.album.publishedAt} keyed>{(albumDate) => <div class="album-date">Sorti le {new Date(albumDate).toLocaleDateString()}</div>}</Show>
			<p>From <A href={`/provider/${props.providerBack.uuid}`}>{props.providerBack.name}</A></p>
		</div>
	</header>;
}
