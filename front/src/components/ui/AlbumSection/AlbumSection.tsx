import { For } from "solid-js";
import { Provider } from "@flex/shared";
import { ProviderInfo } from "~/api/queryHooks/providerInfo";
import AlbumCard, { AlbumCardData } from "../AlbumCard";
import "./AlbumSection.scss";

export type AlbumSectionProps = {
	album: ProviderInfo["album"];
	hiddenProp?: AlbumCardData[];
	providers?: Provider[];
};

export default function AlbumSection(props: AlbumSectionProps) {
	return <div class="album-section">
		<For each={props.album.albums}>{(album) => <AlbumCard album={album} hiddenProp={props.hiddenProp} providers={props.providers}/>}</For>
	</div>;
}
