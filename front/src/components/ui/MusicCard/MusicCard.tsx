import { Show } from "solid-js";
import { t } from "~/i18n/context";
import { A } from "@solidjs/router";
import { buildMediaUrl, Provider } from "@flex/shared";
import { useMediaToken } from "~/api/providerClients";
import { DEFAULT_ALBUM, imgFallback } from "~/utils/imageFallback";
import ArtistsLinks from "../ArtistLinks";
import "./MusicCard.scss";
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

	return <div class="music-card">
		<MusicCover music={props.music}/>
		<div class="music-info">
			<Button variant="text" class="music-name" onClick={playMusic}>{props.music.name}</Button>
			<div class="music-artist"><ArtistsLinks artists={props.music.artists} providerUUID={props.music.provider.uuid}/></div>
			<Show when={props.providers?.find((provider) => provider.uuid === props.music.provider.uuid)}><div class="music-provider">{t("common.from")} <A href={`/provider/${props.music.provider.uuid}`}>{props.providers?.find((provider) => provider.uuid === props.music.provider.uuid)?.name}</A></div></Show>
		</div>
	</div>;
}
