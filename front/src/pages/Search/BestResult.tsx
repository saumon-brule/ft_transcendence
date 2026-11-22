import { Album } from "~/class/Album";
import { Artist } from "~/class/Artist";
import { Music } from "~/class/Music";
import "./BestResult.scss";
import { Match, Show, Switch } from "solid-js";
import { AlbumCover } from "~/components/ui/AlbumCard";
import { A } from "@solidjs/router";
import ArtistsLinks from "~/components/ui/ArtistLinks";
import { ArtistAvatar } from "~/components/ui/ArtistCard";
import MusicCover from "~/components/ui/MusicCover";
import Button from "~/components/inputs/Button";
import { useAudioManagerContext } from "~/components/context/AudioManagerContext";
import { Play } from "lucide-solid";
import { useTranslation } from "~/i18n/context";

export type BestResultProps = {
	best: {
		item: Music | Album | Artist;
		providerName: string;
	} | null;
};

export function BestResult(props: BestResultProps) {
	const { t, locale } = useTranslation();
	const audioManager = useAudioManagerContext();

	function toDate(value: Date | string): Date {
		return value instanceof Date ? value : new Date(value);
	}

	function playMusic(music: Music) {
		audioManager.setCurrentMusic(music);
		audioManager.play();
	}

	return <Show when={props.best} keyed>{(best) => <div class="best-result">
		<Switch>
			<Match when={best.item instanceof Artist && best.item}>{(artist) => <>
				<ArtistAvatar artist={artist()}/>
				<div class="info">
					<A href={`/provider/${artist().provider.uuid}/artist/${artist().uuid}`} class="white-variant name">{artist().name}</A>
					<p>{t("common.from")} <A href={`/provider/${artist().provider.uuid}`}>{best.providerName}</A></p>
				</div>
			</>}</Match>
			<Match when={best.item instanceof Album && best.item}>{(album) => <>
				<AlbumCover album={album()}/>
				<div class="info">
					<A href={`/provider/${album().provider.uuid}/album/${album().uuid}`} class="white-variant name">{album().name}</A>
					<div class="artist">{t("pages.search.bestResult.album")} • <ArtistsLinks artists={album().artists} providerUUID={album().provider.uuid}/></div>
					<Show when={album().publishedAt} keyed>{(albumDate) => <div class="date">{t("common.releasedOn", { date: toDate(albumDate).toLocaleDateString(locale()) })}</div>}</Show>
					<p>{t("common.from")} <A href={`/provider/${album().provider.uuid}`}>{best.providerName}</A></p>
				</div>
			</>}</Match>
			<Match when={best.item instanceof Music && best.item}>{(music) => <>
				<MusicCover music={music()}/>
				<div class="info">
					<A href={`/provider/${music().provider.uuid}${music().album?.uuid ? `/album/${music().album!.uuid}` : ""}`} class="white-variant name">{music().name}</A>
					<div class="artist">{t("pages.search.bestResult.music")} • <ArtistsLinks artists={music().artists} providerUUID={music().provider.uuid}/></div>
					<Show when={music().publishedAt} keyed>{(musicDate) => <div class="date">{t("common.releasedOn", { date: toDate(musicDate).toLocaleDateString(locale()) })}</div>}</Show>
					<p>{t("common.from")} <A href={`/provider/${music().provider.uuid}`}>{best.providerName}</A></p>
				</div>
				<Button onclick={() => playMusic(music())}><Play/> {t("pages.search.bestResult.listen")}</Button>
			</>}</Match>
		</Switch>
	</div>}</Show>;
}
