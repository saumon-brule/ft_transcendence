import { JSX, Show } from "solid-js";
import { A } from "@solidjs/router";
import { buildMediaUrl, Provider } from "@flex/shared";
import { DEFAULT_ARTIST, imgFallback } from "~/utils/imageFallback";
import { useMediaToken } from "~/api/providerClients";
import "../MediaCard.scss";
import "./ArtistCard.scss";
import { t } from "~/i18n/context";
import { Artist } from "~/class/Artist";

export type ArtistAvatarProps = JSX.IntrinsicElements["img"] & { artist: Artist };

export function ArtistAvatar(props: ArtistAvatarProps) {
	const mediaToken = useMediaToken(() => props.artist.provider.address, () => props.artist.provider.uuid);

	const src = () => {
		const token = mediaToken();
		if (token && props.artist.hasAvatar) return buildMediaUrl(props.artist.provider.address, "artistAvatar", props.artist.uuid, token);
		return DEFAULT_ARTIST;
	};

	return <img src={src()} alt={props.artist.name} class="artist-img" onError={imgFallback(DEFAULT_ARTIST)} {...props} />;
}

export type ArtistCardProps = {
	artist: Artist;
	providers?: Provider[];
};

export default function ArtistCard(props: ArtistCardProps) {
	const provider = () => props.providers?.find((p) => p.uuid === props.artist.provider.uuid);

	return <div class="media-card artist-card">
		<ArtistAvatar artist={props.artist}/>
		<div class="media-card-info">
			<A href={props.artist.route()} class="white-variant media-card-name" title={props.artist.name}>{props.artist.name}</A>
			<div class="media-card-subtitle">{t("components.mediaCard.artist")}</div>
			<Show when={provider()}>{(p) => <div class="media-card-provider">{t("common.from")}{" "}<A href={`/provider/${p().uuid}`}>{p().name}</A></div>}</Show>
		</div>
	</div>;
}
