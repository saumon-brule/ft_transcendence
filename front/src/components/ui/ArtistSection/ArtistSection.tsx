import { createEffect, createResource, For, onCleanup } from "solid-js";
import { buildMediaUrl } from "@flex/shared";
import { getMediaToken, getProviderClient } from "~/api/providerClients";
import "./ArtistSection.scss";
import { A } from "@solidjs/router";
import { ProviderInfo } from "~/api/queryHooks/providerInfo";

export type ArtistSectionProps = {
	artist: ProviderInfo["artist"];
	providerUrl: string;
	providerUuid: string;
};

export default function ArtistSection(props: ArtistSectionProps) {
	const [mediaToken, { refetch }] = createResource(() => props.providerUrl, getMediaToken);

	let refreshTimer: ReturnType<typeof setTimeout> | undefined;
	createEffect(() => {
		if (!mediaToken()) return;
		clearTimeout(refreshTimer);
		const expiresAt = getProviderClient(props.providerUrl).mediaToken.expiresAt;
		const delay = expiresAt.getTime() - Date.now() - 30_000;
		refreshTimer = setTimeout(() => void refetch(), Math.max(delay, 0));
	});
	onCleanup(() => clearTimeout(refreshTimer));

	function getAvatar(artist: ArtistSectionProps["artist"]["artists"][number]): string {
		const token = mediaToken();
		if (token && artist.hasAvatar) {
			return buildMediaUrl(props.providerUrl, "artistAvatar", artist.uuid, token);
		}
		return "/images/default_artist.png";
	}

	return <div class="artist-section">
		<For each={props.artist.artists}>{(artist) => <div class="artist">
			<img src={getAvatar(artist)} alt={artist.name} />
			<div class="artist-info">
				<A href={`/provider/${props.providerUuid}/artist/${artist.uuid}`} class="white-variant artist-name">{artist.name}</A>
			</div>
		</div>}</For>
	</div>;
}
