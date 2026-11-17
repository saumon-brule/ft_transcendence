import type { Provider } from "@flex/shared";
import { Accessor, Show } from "solid-js";
import { useMediaToken } from "~/api/providerClients";
import { buildMediaUrl } from "@flex/shared";
import { A } from "@solidjs/router";
import { everyMusicQuery, ProviderArtistQueryBody } from "~/api/queryHooks/providerInfo";
import { useAudioManagerContext } from "~/components/context/AudioManagerContext";
import Button from "~/components/inputs/Button";
import { Play, Shuffle } from "lucide-solid";
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

	async function playMusicGroup(musicGroup: MusicGroup, shuffle: boolean = false) {
		musicGroup.musics = await everyMusicQuery(props.providerBack, props.artist.uuid);
		audioManager.setMusicGroup(musicGroup);
		if (shuffle) audioManager.shuffle();
		audioManager.position = 0;
		audioManager.play();
	}

	function getAvatar(artist: ProviderArtistQueryBody) {
		const token = mediaToken();
		if (artist.hasAvatar && token) {
			return buildMediaUrl(props.providerBack.address, "artistAvatar", artist.uuid, token);
		}
		return "/images/default_artist.webp";
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
			<Show when={props.musicGroup()} fallback={<><Button icon disabled><Play /></Button><Button icon disabled><Shuffle /></Button></>}>
				{(musicGroup) => <>
					<Button icon disabled={musicGroup().musics.length === 0} onClick={() => void playMusicGroup(musicGroup())}><Play /></Button>
					<Button icon disabled={musicGroup().musics.length === 0} onClick={() => void playMusicGroup(musicGroup(), true)}><Shuffle /></Button>
				</>}
			</Show>
		</div>
	</header>;
}
