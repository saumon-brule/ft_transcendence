import { JSX, Show } from "solid-js";
import { A } from "@solidjs/router";
import { buildMediaUrl, Provider } from "@flex/shared";
import { useMediaToken } from "~/api/providerClients";
import { DEFAULT_ALBUM, imgFallback } from "~/utils/imageFallback";
import ArtistsLinks from "../ArtistLinks";
import "./AlbumCard.scss";
import { Album } from "~/class/Album";

export type AlbumCoverProps = JSX.IntrinsicElements["img"] & { album: Album };

export function AlbumCover(props: AlbumCoverProps) {
	const mediaToken = useMediaToken(() => props.album.provider.address, () => props.album.provider.uuid);

	const src = () => {
		const token = mediaToken();
		if (token && props.album.hasCover) return buildMediaUrl(props.album.provider.address, "albumCover", props.album.uuid, token);
		return DEFAULT_ALBUM;
	};

	return <img src={src()} alt={props.album.name} onError={imgFallback(DEFAULT_ALBUM)} {...props} />;
}

export type AlbumCardData = "artists" | "published";

export type AlbumCardProps = {
	album: Album;
	hiddenProp?: AlbumCardData[];
	providers?: Provider[];
};

function toDate(value: Date | string): Date {
	return value instanceof Date ? value : new Date(value);
}

export default function AlbumCard(props: AlbumCardProps) {
	const shown = (column: AlbumCardData) => !props.hiddenProp?.includes(column);

	return <div class="album-card">
		<AlbumCover album={props.album}/>
		<div class="album-info">
			<A href={`/provider/${props.album.provider.uuid}/album/${props.album.uuid}`} class="white-variant album-name">{props.album.name}</A>
			<Show when={shown("artists")}><div class="album-artist"><ArtistsLinks artists={props.album.artists} providerUUID={props.album.provider.uuid}/></div></Show>
			<Show when={shown("published")}><Show when={props.album.publishedAt} keyed>{(albumDate) => <div class="album-date">Sorti le {toDate(albumDate).toLocaleDateString()}</div>}</Show></Show>
			<Show when={props.providers?.find((provider) => provider.uuid === props.album.provider.uuid)}><div class="album-provider">From <A href={`/provider/${props.album.provider.uuid}`}>{props.providers?.find((provider) => provider.uuid === props.album.provider.uuid)?.name}</A></div></Show>
		</div>
	</div>;
}
