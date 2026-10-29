import type { ArtistDetailedItemDto, Provider } from "@flex/shared";
import { createEffect, createResource, onCleanup, Show } from "solid-js";
import { getMediaToken, getProviderClient } from "~/api/providerClients";
import { buildMediaUrl } from "@flex/shared";
import { A } from "@solidjs/router";

export default function ProviderArtistHeader(props: { artist: ArtistDetailedItemDto; providerBack: Provider }) {
	const [mediaToken, { refetch }] = createResource(() => props.providerBack.address, getMediaToken);

	let refreshTimer: ReturnType<typeof setTimeout> | undefined;
	createEffect(() => {
		if (!mediaToken()) return;
		clearTimeout(refreshTimer);
		const expiresAt = getProviderClient(props.providerBack.address).mediaToken.expiresAt;
		const delay = expiresAt.getTime() - Date.now() - 30_000;
		refreshTimer = setTimeout(() => void refetch(), Math.max(delay, 0));
	});
	onCleanup(() => clearTimeout(refreshTimer));

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
