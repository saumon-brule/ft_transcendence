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

export type BestResultProps = {
	best: {
		item: Music | Album | Artist;
		providerName: string;
	} | null;
};

export function BestResult(props: BestResultProps) {
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
					<p>From <A href={`/provider/${artist().provider.uuid}`}>{best.providerName}</A></p>
				</div>
			</>}</Match>
			<Match when={best.item instanceof Album && best.item}>{(album) => <>
				<AlbumCover album={album()}/>
				<div class="info">
					<A href={`/provider/${album().provider.uuid}/album/${album().uuid}`} class="white-variant name">{album().name}</A>
					<div class="artist">Album • <ArtistsLinks artists={album().artists} providerUUID={album().provider.uuid}/></div>
					<Show when={album().publishedAt} keyed>{(albumDate) => <div class="date">Sorti le {toDate(albumDate).toLocaleDateString()}</div>}</Show>
					<p>From <A href={`/provider/${album().provider.uuid}`}>{best.providerName}</A></p>
				</div>
			</>}</Match>
			<Match when={best.item instanceof Music && best.item}>{(music) => <>
				<MusicCover music={music()}/>
				<div class="info">
					<A href={`/provider/${music().provider.uuid}${music().album?.uuid ? `/album/${music().album!.uuid}` : ""}`} class="white-variant name">{music().name}</A>
					<div class="artist">Titre • <ArtistsLinks artists={music().artists} providerUUID={music().provider.uuid}/></div>
					<Show when={music().publishedAt} keyed>{(musicDate) => <div class="date">Sorti le {toDate(musicDate).toLocaleDateString()}</div>}</Show>
					<p>From <A href={`/provider/${music().provider.uuid}`}>{best.providerName}</A></p>
				</div>
				<Button onclick={() => playMusic(music())}><Play/> Listen</Button>
			</>}</Match>
		</Switch>
	</div>}</Show>;
}
