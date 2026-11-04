import { For, Show } from "solid-js";
import { useAudioManagerContext } from "~/components/context/AudioManagerContext";
import { Music } from "~/class/Music";
import { A } from "@solidjs/router";
import Button from "~/components/inputs/Button";
import MusicCover from "../MusicCover";
import ArtistsLinks from "../ArtistLinks";
import { formatTimer } from "~/components/common/MusicTimer/MusicTimer";
import { Track } from "~/class/Track";

import "./TrackList.scss";

export type TrackListColumn = "actions" | "artists" | "album" | "published" | "duration";

export type TrackListProps = {
	tracks: Array<Track>;
	showDeader?: boolean;
	hiddenColumns?: TrackListColumn[];
};

export default function TrackList(props: TrackListProps) {
	const audioManager = useAudioManagerContext();
	const shown = (column: TrackListColumn) => !props.hiddenColumns?.includes(column);

	function toDate(value: Date | string): Date {
		return value instanceof Date ? value : new Date(value);
	}

	function playMusic(music: Music) {
		audioManager.setCurrentTrack(music);
		audioManager.play();
	}

	function addToQueue(music: Music) {
		audioManager.pushTrackToQueue(music);
	}

	return <div class="track-list">
		<table class="data">
			<thead>
				<tr>
					<th class="col-title" scope="col">Title</th>
					<Show when={shown("actions")}><th class="col-actions" scope="col">Actions</th></Show>
					<Show when={shown("artists")}><th class="col-artists" scope="col">Artists</th></Show>
					<Show when={shown("album")}><th class="col-album" scope="col">Album</th></Show>
					<Show when={shown("published")}><th class="col-published" scope="col">Published</th></Show>
					<Show when={shown("duration")}><th class="col-duration" scope="col">Duration</th></Show>
				</tr>
			</thead>
			<tbody>
				<For each={props.tracks}>{(track) => <tr>
					<td class="col-title">
						<div class="track-title">
							<MusicCover music={track.music} />
							<div class="track-title-text">
								<Button variant="text" onClick={() => void playMusic(track.music)}>{track.music.name}</Button>
								<Show when={shown("artists")}>
									<span class="track-title-artists">
										<ArtistsLinks artists={track.music.artists} providerUUID={track.music.providerUuid} />
									</span>
								</Show>
							</div>
						</div>
					</td>
					<Show when={shown("actions")}><td class="col-actions"><button onClick={() => void addToQueue(track.music)}>AddToQueue</button></td></Show>
					<Show when={shown("artists")}><td class="col-artists"><ArtistsLinks artists={track.music.artists} providerUUID={track.music.providerUuid} /></td></Show>
					<Show when={shown("album")}><td class="col-album">{track.music.hasAlbum() ? <A href={track.music.albumRoute()} class="white-variant">{track.music.album.name}</A> : "-"}</td></Show>
					<Show when={shown("published")}><td class="col-published">{track.music.publishedAt ? toDate(track.music.publishedAt).toLocaleDateString() : "-"}</td></Show>
					<Show when={shown("duration")}><td class="col-duration">{formatTimer(track.music.duration)}</td></Show>
				</tr>}</For>
			</tbody>
		</table>
	</div>;
}
