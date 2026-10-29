import { createEffect, createResource, For, onCleanup, Show } from "solid-js";
import { buildMediaUrl } from "@flex/shared";
import { getMediaToken, getProviderClient } from "~/api/providerClients";
import "./AlbumSection.scss";
import { A } from "@solidjs/router";
import { ProviderInfo } from "~/api/queryHooks/providerInfo";

function ArtistsLinks(props: { album: AlbumSectionProps["album"]["albums"][number]; providerUUID: string }) {
	return <>{props.album.artists.length === 0
		? "-"
		: <For each={props.album.artists}>{(artist, index) => <>
			<A href={`/provider/${props.providerUUID}/artist/${artist.uuid}`} class="white-variant">{artist.name}</A>
			{index() < props.album.artists.length - 1 ? ", " : ""}
		</>}</For>
	}</>;
}

export type AlbumSectionData = "artists" | "published";

export type AlbumSectionProps = {
	album: ProviderInfo["album"];
	providerUrl: string;
	providerUuid: string;
	hiddenProp?: AlbumSectionData[];
};

export default function AlbumSection(props: AlbumSectionProps) {
	const shown = (column: AlbumSectionData) => !props.hiddenProp?.includes(column);
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


	function toDate(value: Date | string): Date {
		return value instanceof Date ? value : new Date(value);
	}

	function getCover(album: AlbumSectionProps["album"]["albums"][number]): string {
		const token = mediaToken();
		if (token && album.hasCover) {
			return buildMediaUrl(props.providerUrl, "albumCover", album.uuid, token);
		}
		return "/images/default_album.png";
	}

	return <div class="album-section">
		<For each={props.album.albums}>{(album) => <div class="album">
			<img src={getCover(album)} alt={album.name} />
			<div class="album-info">
				<A href={`/provider/${props.providerUuid}/album/${album.uuid}`} class="white-variant album-name">{album.name}</A>
				<Show when={shown("artists")}><div class="album-artist"><ArtistsLinks album={album} providerUUID={props.providerUuid}/></div></Show>
				<Show when={shown("published")}><Show when={album.publishedAt} keyed>{(albumDate) => <div class="album-date">Sorti le {toDate(albumDate).toLocaleDateString()}</div>}</Show></Show>
			</div>
		</div>}</For>
	</div>;
}
