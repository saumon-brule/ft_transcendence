import { Show } from "solid-js";
import { t } from "~/i18n/context";
import { A } from "@solidjs/router";
import { buildMediaUrl, Provider } from "@flex/shared";
import { useMediaToken } from "~/api/providerClients";
import { DEFAULT_ALBUM, imgFallback } from "~/utils/imageFallback";
import ArtistsLinks from "~/components/ui/elements/ArtistLinks";
import "../MediaCard.scss";
import { Music } from "~/class/Music";
import Button from "~/components/inputs/Button";
import { useAudioManagerContext } from "~/components/context/AudioManagerContext";

export function MusicCover(props: { music: Music }) {
	const mediaToken = useMediaToken(() => props.music.provider.address, () => props.music.provider.uuid);

	const src = () => {
		const token = mediaToken();
		if (token && props.music.hasCover) return buildMediaUrl(props.music.provider.address, "musicCover", props.music.uuid, token);
		return DEFAULT_ALBUM;
	};

	return <img src={src()} alt={props.music.name} onError={imgFallback(DEFAULT_ALBUM)} />;
}

export type MusicCardData = "artists" | "published";

export type MusicCardProps = {
	music: Music;
	providers?: Provider[];
};

export default function MusicCard(props: MusicCardProps) {
	const audioManager = useAudioManagerContext();

	function playMusic() {
		audioManager.setCurrentMusic(props.music);
		audioManager.play();
	}

	const provider = () => props.providers?.find((p) => p.uuid === props.music.provider.uuid);

	return <div class="media-card music-card">
		<MusicCover music={props.music}/>
		<div class="media-card-info">
			<Button variant="text" class="media-card-name" onClick={playMusic} title={props.music.name}>{props.music.name}</Button>
			<div class="media-card-subtitle">{t("components.mediaCard.music")}</div>
			<Show when={props.music.artists.length > 0}>
				<div class="media-card-subtitle"><ArtistsLinks artists={props.music.artists} providerUUID={props.music.provider.uuid}/></div>
			</Show>
			<Show when={props.music.hasAlbum() && props.music}>
				{(music) => <div class="media-card-subtitle"><A href={music().albumRoute()} class="white-variant">{music().album.name}</A></div>}
			</Show>
			<Show when={provider()}>{(p) => <div class="media-card-provider">{t("common.from")}{" "}<A href={`/provider/${p().uuid}`}>{p().name}</A></div>}</Show>
		</div>
	</div>;
}
