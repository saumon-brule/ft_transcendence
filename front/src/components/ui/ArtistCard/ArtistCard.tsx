import { Show } from "solid-js";
import { A } from "@solidjs/router";
import { buildMediaUrl, Provider } from "@flex/shared";
import { DEFAULT_ARTIST, imgFallback } from "~/utils/imageFallback";
import { useMediaToken } from "~/api/providerClients";
import "./ArtistCard.scss";
import { Artist } from "~/class/Artist";

export function ArtistAvatar(props: { artist: Artist }) {
	const mediaToken = useMediaToken(() => props.artist.provider.address, () => props.artist.provider.uuid);

	const src = () => {
		const token = mediaToken();
		if (token && props.artist.hasAvatar) return buildMediaUrl(props.artist.provider.address, "artistAvatar", props.artist.uuid, token);
		return DEFAULT_ARTIST;
	};

	return <img src={src()} alt={props.artist.name} class="artist-img" onError={imgFallback(DEFAULT_ARTIST)} />;
}

export type ArtistCardProps = {
	artist: Artist;
	providers?: Provider[];
};

export default function ArtistCard(props: ArtistCardProps) {
	return <div class="artist-card">
		<ArtistAvatar artist={props.artist}/>
		<div class="artist-info">
			<A href={props.artist.route()} class="white-variant artist-name">{props.artist.name}</A>
			<Show when={props.providers?.find((provider) => provider.uuid === props.artist.provider.uuid)}>
				<div class="artist-provider">
					From
					<A href={`/provider/${props.artist.provider.uuid}`}>
						{props.providers?.find((provider) => provider.uuid === props.artist.provider.uuid)?.name}
					</A>
				</div>
			</Show>
		</div>
	</div>;
}
