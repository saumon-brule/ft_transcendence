import { For, Show } from "solid-js";
import { buildMediaUrl } from "@flex/shared";
import { useMediaToken } from "~/api/providerClients";
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

function AlbumCover(props: { album: ProviderInfo["album"]["albums"][number]; providerUrl: string }) {
	const mediaToken = useMediaToken(() => props.providerUrl);

	const src = () => {
		const token = mediaToken();
		if (token && props.album.hasCover) return buildMediaUrl(props.providerUrl, "albumCover", props.album.uuid, token);
		return "/images/default_album.png";
	};

	return <img src={src()} alt={props.album.name} />;
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

	function toDate(value: Date | string): Date {
		return value instanceof Date ? value : new Date(value);
	}

	return <div class="album-section">
		<For each={props.album.albums}>{(album) => <div class="album">
			<AlbumCover album={album} providerUrl={props.providerUrl} />
			<div class="album-info">
				<A href={`/provider/${props.providerUuid}/album/${album.uuid}`} class="white-variant album-name">{album.name}</A>
				<Show when={shown("artists")}><div class="album-artist"><ArtistsLinks album={album} providerUUID={props.providerUuid}/></div></Show>
				<Show when={shown("published")}><Show when={album.publishedAt} keyed>{(albumDate) => <div class="album-date">Sorti le {toDate(albumDate).toLocaleDateString()}</div>}</Show></Show>
			</div>
		</div>}</For>
	</div>;
}
