import { For, Show } from "solid-js";
import { buildMediaUrl, Provider } from "@flex/shared";
import { useMediaToken } from "~/api/providerClients";
import "./ArtistSection.scss";
import { A } from "@solidjs/router";
import { ProviderInfo } from "~/api/queryHooks/providerInfo";

export type ArtistSectionProps = {
	artist: ProviderInfo["artist"];
	providers?: Provider[];
};

export function ArtistAvatar(props: { artist: ProviderInfo["artist"]["artists"][number] }) {
	const mediaToken = useMediaToken(() => props.artist.providerUrl);

	const src = () => {
		const token = mediaToken();
		if (token && props.artist.hasAvatar) return buildMediaUrl(props.artist.providerUrl, "artistAvatar", props.artist.uuid, token);
		return "/images/default_artist.png";
	};

	return <img src={src()} alt={props.artist.name} class="artist-img"/>;
}

export default function ArtistSection(props: ArtistSectionProps) {
	return <div class="artist-section">
		<For each={props.artist.artists}>{(artist) => <div class="artist">
			<ArtistAvatar artist={artist}/>
			<div class="artist-info">
				<A href={`/provider/${artist.providerUuid}/artist/${artist.uuid}`} class="white-variant artist-name">{artist.name}</A>
				<Show when={props.providers?.length}><div class="album-provider">From <A href={`/provider/${artist.providerUuid}`}>{props.providers?.find((provider) => provider.uuid === artist.providerUuid)?.name}</A></div></Show>
			</div>
		</div>}</For>
	</div>;
}
