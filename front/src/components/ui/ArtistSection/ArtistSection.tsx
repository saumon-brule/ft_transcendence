import { For } from "solid-js";
import { Provider } from "@flex/shared";
import { ProviderInfo } from "~/api/queryHooks/providerInfo";
import ArtistCard from "../ArtistCard";
import "./ArtistSection.scss";

export type ArtistSectionProps = {
	artist: ProviderInfo["artist"];
	providers?: Provider[];
};

export default function ArtistSection(props: ArtistSectionProps) {
	return <div class="artist-section">
		<For each={props.artist.artists}>{(artist) => <ArtistCard artist={artist} providers={props.providers}/>}</For>
	</div>;
}
