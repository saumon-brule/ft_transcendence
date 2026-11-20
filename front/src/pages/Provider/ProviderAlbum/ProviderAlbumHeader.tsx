import type { Provider } from "@flex/shared";
import { Show } from "solid-js";
import { useMediaToken } from "~/api/providerClients";
import { buildMediaUrl } from "@flex/shared";
import { A } from "@solidjs/router";
import Button from "~/components/inputs/Button";
import { Play, Shuffle } from "lucide-solid";
import { useAudioManagerContext } from "~/components/context/AudioManagerContext";
import { everyMusicQuery, ProviderAlbumQueryBody } from "~/api/queryHooks/providerInfo";
import { MusicGroup } from "~/store/trackManager.store";
import { Accessor } from "solid-js";
import { Album } from "~/class/Album";
import { history } from "~/store/history.store";
import { DEFAULT_ALBUM, imgFallback } from "~/utils/imageFallback";

export type ProviderAlbumHeaderProps = {
	album: ProviderAlbumQueryBody;
	providerBack: Provider;
	musicGroup: Accessor<MusicGroup | null>;
	musicTotal?: number;
};

export default function ProviderAlbumHeader(props: ProviderAlbumHeaderProps) {
	const mediaToken = useMediaToken(() => props.providerBack.address, () => props.providerBack.uuid);
	const audioManager = useAudioManagerContext();

	async function playMusicGroup(musicGroup: MusicGroup, shuffle: boolean = false) {
		musicGroup.musics = await everyMusicQuery(props.providerBack, undefined, props.album.uuid);
		audioManager.setMusicGroup(musicGroup);
		if (shuffle) audioManager.shuffle();
		audioManager.position = 0;
		audioManager.play();
		history.album.listen(Album.fromRawObject(props.album, props.providerBack.address, props.providerBack.uuid));
	}

	function getCover(album: ProviderAlbumQueryBody) {
		const token = mediaToken();
		if (album.hasCover && token) {
			return buildMediaUrl(props.providerBack.address, "albumCover", album.uuid, token);
		}
		return DEFAULT_ALBUM;
	}

	return <header class="provider-image-header">
		<img src={getCover(props.album)} alt="Album cover" onError={imgFallback(DEFAULT_ALBUM)} />
		<div class="header-info">
			<h2>{props.album.name}</h2>
			<div class="stats">
				<div class="stat">{props.musicTotal ?? "-"} tracks</div>
				<div class="separator" />
				<div class="stat">{props.album.artists.length} artists</div>
			</div>
			<Show when={props.album.publishedAt} keyed>{(albumDate) => <div class="album-date">Sorti le {new Date(albumDate).toLocaleDateString()}</div>}</Show>
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
