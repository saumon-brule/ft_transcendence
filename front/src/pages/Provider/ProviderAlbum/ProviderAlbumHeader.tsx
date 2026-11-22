import { useProvider } from "~/components/guards/ProviderInfoGuard";
import { createSignal, Show } from "solid-js";
import { useMediaToken } from "~/api/providerClients";
import { buildMediaUrl } from "@flex/shared";
import { A } from "@solidjs/router";
import Button from "~/components/inputs/Button";
import { Play, Shuffle } from "lucide-solid";
import { useAudioManagerContext } from "~/components/context/AudioManagerContext";
import { everyMusicQuery, ProviderAlbumQueryBody } from "~/api/queryHooks/providerInfo";
import { Album } from "~/class/Album";
import { history } from "~/store/history.store";
import { DEFAULT_ALBUM, imgFallback } from "~/utils/imageFallback";
import { useTranslation } from "~/i18n/context";

export type ProviderAlbumHeaderProps = {
	album: ProviderAlbumQueryBody;
};

export default function ProviderAlbumHeader(props: ProviderAlbumHeaderProps) {
	const { t, locale } = useTranslation();
	const provider = useProvider();
	const mediaToken = useMediaToken(() => provider.address, () => provider.uuid);
	const audioManager = useAudioManagerContext();

	const [loading, setLoading] = createSignal(false);

	async function playAlbum(shuffle: boolean = false) {
		setLoading(true);
		const musics = await everyMusicQuery(provider, undefined, props.album.uuid);
		setLoading(false);
		if (!musics) return;

		audioManager.setMusicGroup({
			name: props.album.name,
			route: `/provider/${provider.uuid}/album/${props.album.uuid}`,
			musics,
		});
		if (shuffle) audioManager.shuffle();
		audioManager.position = 0;
		audioManager.play();
		history.album.listen(Album.fromRawObject(props.album, provider));
	}

	function getCover(album: ProviderAlbumQueryBody) {
		const token = mediaToken();
		if (album.hasCover && token) {
			return buildMediaUrl(provider.address, "albumCover", album.uuid, token);
		}
		return DEFAULT_ALBUM;
	}

	return <header class="provider-image-header">
		<img src={getCover(props.album)} alt={t("common.albumCover")} onError={imgFallback(DEFAULT_ALBUM)} />
		<div class="header-info">
			<h2>{props.album.name}</h2>
			<div class="stats">
				<div class="stat">{t("pages.provider.stats.tracks", { count: String(props.album.musicCount) })}</div>
				<div class="separator" />
				<div class="stat">{t("pages.provider.stats.artists", { count: String(props.album.artists.length) })}</div>
			</div>
			<Show when={props.album.publishedAt} keyed>{(albumDate) => <div class="album-date">{t("common.releasedOn", { date: new Date(albumDate).toLocaleDateString(locale()) })}</div>}</Show>
			<p>{t("common.from")} <A href={`/provider/${provider.uuid}`}>{provider.name}</A></p>
		</div>
		<div class="header-controls">
			<Button icon disabled={props.album.musicCount === 0 || loading()} onClick={() => void playAlbum()}><Play /></Button>
			<Button icon disabled={props.album.musicCount === 0 || loading()} onClick={() => void playAlbum(true)}><Shuffle /></Button>
		</div>
	</header>;
}
