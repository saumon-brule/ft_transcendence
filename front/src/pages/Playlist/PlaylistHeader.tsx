import { Show } from "solid-js";
import { A } from "@solidjs/router";
import type { PlaylistDetailDto } from "@flex/shared";
import { env } from "~/env";
import { Music } from "~/class/Music";
import type { MusicSectionItem } from "~/components/ui/MusicSection/MusicSection";

type PlaylistHeaderProps = {
	playlist: PlaylistDetailDto;
	tracks: MusicSectionItem[];
};

function formatTotalDuration(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	return hours > 0
		? `${hours} h ${minutes} min`
		: `${minutes} min`;
}

export default function PlaylistHeader(props: PlaylistHeaderProps) {
	const musics = () => props.tracks.filter((track): track is Music => track instanceof Music);
	const loading = () => props.tracks.some((track) => !(track instanceof Music) && track.state === "loading");
	const unavailable = () => props.tracks.length - musics().length;
	const totalDuration = () => musics().reduce((total, music) => total + music.duration, 0);

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
	</header>;
}
