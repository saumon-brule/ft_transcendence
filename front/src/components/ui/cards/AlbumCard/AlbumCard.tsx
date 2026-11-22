import { JSX, Show } from "solid-js";
import { locale, t } from "~/i18n/context";
import { A } from "@solidjs/router";
import { buildMediaUrl, Provider } from "@flex/shared";
import { useMediaToken } from "~/api/providerClients";
import { DEFAULT_ALBUM, imgFallback } from "~/utils/imageFallback";
import ArtistsLinks from "~/components/ui/elements/ArtistLinks";
import "../MediaCard.scss";
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

	const provider = () => props.providers?.find((p) => p.uuid === props.album.provider.uuid);

	return <div class="media-card album-card">
		<AlbumCover album={props.album}/>
		<div class="media-card-info">
			<A href={`/provider/${props.album.provider.uuid}/album/${props.album.uuid}`} class="white-variant media-card-name" title={props.album.name}>{props.album.name}</A>
			<div class="media-card-subtitle">{t("components.mediaCard.album")}</div>
			<Show when={shown("artists") && props.album.artists.length > 0}>
				<div class="media-card-subtitle"><ArtistsLinks artists={props.album.artists} providerUUID={props.album.provider.uuid}/></div>
			</Show>
			<Show when={shown("published")}><Show when={props.album.publishedAt} keyed>{(albumDate) => <div class="media-card-date">{t("common.releasedOn", { date: toDate(albumDate).toLocaleDateString(locale()) })}</div>}</Show></Show>
			<Show when={provider()}>{(p) => <div class="media-card-provider">{t("common.from")}{" "}<A href={`/provider/${p().uuid}`}>{p().name}</A></div>}</Show>
		</div>
	</div>;
}
