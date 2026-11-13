import type { Provider } from "@flex/shared";
import { Show } from "solid-js";
import { useMediaToken } from "~/api/providerClients";
import { buildMediaUrl } from "@flex/shared";
import { A } from "@solidjs/router";
import Button from "~/components/inputs/Button";
import { Play } from "lucide-solid";
import { useAudioManagerContext } from "~/components/context/AudioManagerContext";
import { ProviderAlbumQueryBody } from "~/api/queryHooks/providerInfo";
import { MusicGroup } from "~/store/trackManager.store";
import { Accessor } from "solid-js";

export type ProviderAlbumHeaderProps = {
	album: ProviderAlbumQueryBody;
	providerBack: Provider;
	musicGroup: Accessor<MusicGroup | null>;
	musicTotal?: number;
};

export default function ProviderAlbumHeader(props: ProviderAlbumHeaderProps) {
	const mediaToken = useMediaToken(() => props.providerBack.address, () => props.providerBack.uuid);
	const audioManager = useAudioManagerContext();

	function playMusicGroup(musicGroup: MusicGroup) {
		audioManager.setMusicGroup(musicGroup);
		audioManager.position = 0;
		audioManager.play();
	}

	function getCover(album: ProviderAlbumQueryBody) {
		const token = mediaToken();
		if (album.hasCover && token) {
			return buildMediaUrl(props.providerBack.address, "albumCover", album.uuid, token);
		}
		return "/images/default_album.png";
	}

	return <header class="provider-image-header">
		<img src={getCover(props.album)} alt="Profile picture" />
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
			<Show when={props.musicGroup()} fallback={<Button icon disabled><Play /></Button>}>
				{(musicGroup) => <Button icon onClick={() => playMusicGroup(musicGroup())}><Play /></Button>}
			</Show>
		</div>
	</header>;
}
