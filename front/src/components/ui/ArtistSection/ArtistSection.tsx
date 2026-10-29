import { For } from "solid-js";
import { buildMediaUrl } from "@flex/shared";
import { useMediaToken } from "~/api/providerClients";
import "./ArtistSection.scss";
import { A } from "@solidjs/router";
import { ProviderInfo } from "~/api/queryHooks/providerInfo";

export type ArtistSectionProps = {
	artist: ProviderInfo["artist"];
	providerUrl: string;
	providerUuid: string;
};

function ArtistAvatar(props: { artist: ProviderInfo["artist"]["artists"][number]; providerUrl: string }) {
	const mediaToken = useMediaToken(() => props.providerUrl);

	const src = () => {
		const token = mediaToken();
		if (token && props.artist.hasAvatar) return buildMediaUrl(props.providerUrl, "artistAvatar", props.artist.uuid, token);
		return "/images/default_artist.png";
	};

	return <img src={src()} alt={props.artist.name} />;
}

export default function ArtistSection(props: ArtistSectionProps) {
	return <div class="artist-section">
		<For each={props.artist.artists}>{(artist) => <div class="artist">
			<ArtistAvatar artist={artist} providerUrl={props.providerUrl} />
			<div class="artist-info">
				<A href={`/provider/${props.providerUuid}/artist/${artist.uuid}`} class="white-variant artist-name">{artist.name}</A>
			</div>
		</div>}</For>
	</div>;
}
