import { Show } from "solid-js";
import { A } from "@solidjs/router";
import type { PlaylistDetailDto } from "@flex/shared";
import { env } from "~/env";
import { Music } from "~/class/Music";
import { MusicGroup } from "~/store/trackManager.store";
import { useAudioManagerContext } from "~/components/context/AudioManagerContext";
import Button from "~/components/inputs/Button";
import { Play, Shuffle } from "lucide-solid";

type PlaylistHeaderProps = {
	playlist: PlaylistDetailDto;
	musicGroup: MusicGroup;
};

function formatTotalDuration(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	return hours > 0
		? `${hours} h ${minutes} min`
		: `${minutes} min`;
}

export default function PlaylistHeader(props: PlaylistHeaderProps) {
	const audioManager = useAudioManagerContext();

	const musics = () => props.musicGroup.musics.filter((music): music is Music => music instanceof Music);
	const loading = () => props.musicGroup.musics.some((music) => music.isLoading());
	const unavailable = () => props.musicGroup.musics.length - musics().length;
	const totalDuration = () => musics().reduce((total, music) => total + music.duration, 0);

	function playMusicGroup(musicGroup: MusicGroup, shuffle: boolean = false) {
		audioManager.setMusicGroup(musicGroup);
		if (shuffle) audioManager.shuffle();
		audioManager.position = 0;
		audioManager.play();
	}

	return <header class="playlist-header">
		<img src={`${env.VITE_API_URL}/playlists/${props.playlist.uuid}/cover`} alt="Playlist cover" />
		<div class="header-info">
			<Show when={props.playlist.private}><span class="badge">Private</span></Show>
			<h2>{props.playlist.name}</h2>
			<div class="stats">
				<span class="stat">{props.playlist.musics.length} musics</span>
				<Show when={!loading() && musics().length > 0}>
					<div class="separator" />
					<span class="stat">{formatTotalDuration(totalDuration())}</span>
				</Show>
				<Show when={!loading() && unavailable() > 0}>
					<div class="separator" />
					<span class="stat">{unavailable()} unavailable</span>
				</Show>
			</div>
			<p>By <A href={`/user/${props.playlist.owner.uuid}`}>{props.playlist.owner.username}</A></p>
		</div>
		<div class="header-controls">
			<Show when={props.musicGroup} fallback={<><Button icon disabled><Play /></Button><Button icon disabled><Shuffle /></Button></>}>
				{(musicGroup) => <>
					<Button icon disabled={musicGroup().musics.length === 0} onClick={() => playMusicGroup(musicGroup())}><Play /></Button>
					<Button icon disabled={musicGroup().musics.length === 0} onClick={() => playMusicGroup(musicGroup(), true)}><Shuffle /></Button>
				</>}
			</Show>
		</div>
	</header>;
}
