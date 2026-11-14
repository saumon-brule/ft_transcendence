import { For, Show } from "solid-js";
import { buildMediaUrl, Provider } from "@flex/shared";
import { useMediaToken } from "~/api/providerClients";
import "./AlbumSection.scss";
import { A } from "@solidjs/router";
import { ProviderInfo } from "~/api/queryHooks/providerInfo";
import ArtistsLinks from "../ArtistLinks";

export function AlbumCover(props: { album: ProviderInfo["album"]["albums"][number] }) {
	const mediaToken = useMediaToken(() => props.album.providerUrl, () => props.album.providerUuid);

	const src = () => {
		const token = mediaToken();
		if (token && props.album.hasCover) return buildMediaUrl(props.album.providerUrl, "albumCover", props.album.uuid, token);
		return "/images/default_album.webp";
	};

	return <img src={src()} alt={props.album.name} />;
}

export type AlbumSectionData = "artists" | "published";

export type AlbumSectionProps = {
	album: ProviderInfo["album"];
	hiddenProp?: AlbumSectionData[];
	providers?: Provider[];
};

export default function AlbumSection(props: AlbumSectionProps) {
	const shown = (column: AlbumSectionData) => !props.hiddenProp?.includes(column);

	function toDate(value: Date | string): Date {
		return value instanceof Date ? value : new Date(value);
	}

	return <div class="album-section">
		<For each={props.album.albums}>{(album) => <div class="album">
			<AlbumCover album={album}/>
			<div class="album-info">
				<A href={`/provider/${album.providerUuid}/album/${album.uuid}`} class="white-variant album-name">{album.name}</A>
				<Show when={shown("artists")}><div class="album-artist"><ArtistsLinks artists={album.artists} providerUUID={album.providerUuid}/></div></Show>
				<Show when={shown("published")}><Show when={album.publishedAt} keyed>{(albumDate) => <div class="album-date">Sorti le {toDate(albumDate).toLocaleDateString()}</div>}</Show></Show>
				<Show when={props.providers?.length}><div class="album-provider">From <A href={`/provider/${album.providerUuid}`}>{props.providers?.find((provider) => provider.uuid === album.providerUuid)?.name}</A></div></Show>
			</div>
		</div>}</For>
	</div>;
}
