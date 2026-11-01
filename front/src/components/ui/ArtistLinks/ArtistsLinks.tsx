import { ProviderDataMusicDto } from "@flex/shared";
import { A } from "@solidjs/router";
import { For } from "solid-js";

export type MusicCoverProps = {
	artists: ProviderDataMusicDto["artists"];
	providerUUID: string;
};

export default function ArtistsLinks(props: MusicCoverProps) {
	return <>{props.artists.length === 0
		? "-"
		: <For each={props.artists}>
			{(artist, index) => <>
				<A href={`/provider/${props.providerUUID}/artist/${artist.uuid}`} class="white-variant">{artist.name}</A>
				{index() < props.artists.length - 1 ? ", " : ""}
			</>}
		</For>
	}</>;
}
