import type { Provider } from "@flex/shared";
import { Accessor, Show } from "solid-js";
import { useMediaToken } from "~/api/providerClients";
import { buildMediaUrl } from "@flex/shared";
import { A } from "@solidjs/router";
import { ProviderArtistQueryBody } from "~/api/queryHooks/providerInfo";
import { useAudioManagerContext } from "~/components/context/AudioManagerContext";
import Button from "~/components/inputs/Button";
import { Play } from "lucide-solid";
import { MusicGroup } from "~/store/trackManager.store";

export type ProviderArtistHeaderProps = {
	artist: ProviderArtistQueryBody;
	providerBack: Provider;
	musicGroup: Accessor<MusicGroup | null>;
	musicTotal?: number;
	albumTotal?: number;
};

export default function ProviderArtistHeader(props: ProviderArtistHeaderProps) {
	const mediaToken = useMediaToken(() => props.providerBack.address, () => props.providerBack.uuid);
	const audioManager = useAudioManagerContext();

	function playMusicGroup(musicGroup: MusicGroup) {
		audioManager.setMusicGroup(musicGroup);
		audioManager.position = 0;
		audioManager.play();
	}

	function getAvatar(artist: ProviderArtistQueryBody) {
		const token = mediaToken();
		if (artist.hasAvatar && token) {
			return buildMediaUrl(props.providerBack.address, "artistAvatar", artist.uuid, token);
		}
		return "/images/default_artist.png";
	}

	return <header class="provider-image-header">
		<img src={getAvatar(props.artist)} alt="Profile picture" />
		<div class="header-info">
			<h2>{props.artist.name}</h2>
			<div class="stats">
				<div class="stat">{props.musicTotal ?? "-"} tracks</div>
				<div class="separator" />
				<div class="stat">{props.albumTotal ?? "-"} albums</div>
			</div>
			<Show when={props.artist.biography}>
				<p class="bio">{props.artist.biography}</p>
			</Show>
			<p>From <A href={`/provider/${props.providerBack.uuid}`}>{props.providerBack.name}</A></p>
		</div>
		<div class="header-controls">
			<Show when={props.musicGroup()} fallback={<Button icon disabled><Play /></Button>}>
				{(musicGroup) => <Button icon disabled={musicGroup().musics.length === 0} onClick={() => playMusicGroup(musicGroup())}><Play /></Button>}
			</Show>
		</div>
	</header>;
}
