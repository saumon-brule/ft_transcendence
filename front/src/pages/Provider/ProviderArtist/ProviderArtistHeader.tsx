import { useProvider } from "~/components/guards/ProviderInfoGuard";
import { createSignal, Show } from "solid-js";
import { useMediaToken } from "~/api/providerClients";
import { buildMediaUrl } from "@flex/shared";
import { DEFAULT_ARTIST, imgFallback } from "~/utils/imageFallback";
import { A } from "@solidjs/router";
import { everyMusicQuery, ProviderArtistQueryBody } from "~/api/queryHooks/providerInfo";
import { useAudioManagerContext } from "~/components/context/AudioManagerContext";
import Button from "~/components/inputs/Button";
import { Play, Shuffle } from "lucide-solid";
import { history } from "~/store/history.store";
import { Artist } from "~/class/Artist";

export type ProviderArtistHeaderProps = {
	artist: ProviderArtistQueryBody;
};

export default function ProviderArtistHeader(props: ProviderArtistHeaderProps) {
	const provider = useProvider();
	const mediaToken = useMediaToken(() => provider.address, () => provider.uuid);
	const audioManager = useAudioManagerContext();

	const [loading, setLoading] = createSignal(false);

	async function playArtist(shuffle: boolean = false) {
		setLoading(true);
		const musics = await everyMusicQuery(provider, props.artist.uuid);
		setLoading(false);
		if (!musics) return;

		audioManager.setMusicGroup({
			name: props.artist.name,
			route: `/provider/${provider.uuid}/artist/${props.artist.uuid}`,
			musics,
		});
		if (shuffle) audioManager.shuffle();
		audioManager.position = 0;
		audioManager.play();
		history.artist.listen(Artist.fromRawObject(props.artist, provider));
	}

	function getAvatar(artist: ProviderArtistQueryBody) {
		const token = mediaToken();
		if (artist.hasAvatar && token) {
			return buildMediaUrl(provider.address, "artistAvatar", artist.uuid, token);
		}
		return DEFAULT_ARTIST;
	}

	return <header class="provider-image-header">
		<img src={getAvatar(props.artist)} alt="Artist picture" onError={imgFallback(DEFAULT_ARTIST)} />
		<div class="header-info">
			<h2>{props.artist.name}</h2>
			<div class="stats">
				<div class="stat">{props.artist.musicCount} tracks</div>
				<div class="separator" />
				<div class="stat">{props.artist.albumCount} albums</div>
			</div>
			<Show when={props.artist.biography}>
				<p class="bio">{props.artist.biography}</p>
			</Show>
			<p>From <A href={`/provider/${provider.uuid}`}>{provider.name}</A></p>
		</div>
		<div class="header-controls">
			<Button icon disabled={props.artist.musicCount === 0 || loading()} onClick={() => void playArtist()}><Play /></Button>
			<Button icon disabled={props.artist.musicCount === 0 || loading()} onClick={() => void playArtist(true)}><Shuffle /></Button>
		</div>
	</header>;
}
