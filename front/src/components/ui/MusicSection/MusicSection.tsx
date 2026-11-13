import { For, Show } from "solid-js";
import { useAudioManagerContext } from "~/components/context/AudioManagerContext";
import { Music } from "~/class/Music";
import "./MusicSection.scss";
import { A } from "@solidjs/router";
import Button from "~/components/inputs/Button";
import MusicCover from "../MusicCover";
import ArtistsLinks from "../ArtistLinks";
import { formatTimer } from "~/components/common/MusicTimer/MusicTimer";
import { Provider } from "@flex/shared";
import type { UnavailableTrack } from "~/utils/playlistTracks";
import UnavailableTrackRow, { type PlaylistContext } from "./UnavailableTrackRow";

export type MusicSectionColumn = "actions" | "artists" | "album" | "published" | "duration";

export type MusicSectionItem = Music | UnavailableTrack;

export type MusicSectionProps = {
	music: { musics: MusicSectionItem[]; total: number };
	hiddenColumns?: MusicSectionColumn[];
	providers?: Provider[];
	playlist?: PlaylistContext;
};

export default function MusicSection(props: MusicSectionProps) {
	const audioManager = useAudioManagerContext();
	const shown = (column: MusicSectionColumn) => !props.hiddenColumns?.includes(column);

	function toDate(value: Date | string): Date {
		return value instanceof Date ? value : new Date(value);
	}

	const columnCount = () => 1
		+ (shown("actions") ? 1 : 0)
		+ (shown("artists") ? 1 : 0)
		+ (shown("album") ? 1 : 0)
		+ (props.providers?.length ? 1 : 0)
		+ (shown("published") ? 1 : 0)
		+ (shown("duration") ? 1 : 0);

	function asMusic(item: MusicSectionItem): Music | undefined {
		return item instanceof Music
			? item
			: undefined;
	}

	function playMusic(music: Music) {
		audioManager.setCurrentTrack(music);
		audioManager.play();
	}

	function addToQueue(music: Music) {
		audioManager.pushTrackToQueue(music);
	}

	return <div class="music-section">
		<table class="data">
			<thead>
				<tr>
					<th class="col-title" scope="col">Title</th>
					<Show when={shown("actions")}><th class="col-actions" scope="col">Actions</th></Show>
					<Show when={shown("artists")}><th class="col-artists" scope="col">Artists</th></Show>
					<Show when={shown("album")}><th class="col-album" scope="col">Album</th></Show>
					<Show when={props.providers?.length}><th class="col-provider" scope="col">Provider</th></Show>
					<Show when={shown("published")}><th class="col-published" scope="col">Published</th></Show>
					<Show when={shown("duration")}><th class="col-duration" scope="col">Duration</th></Show>
				</tr>
			</thead>
			<tbody>
				<For each={props.music.musics}>{(item) => <Show
					when={asMusic(item)}
					keyed
					fallback={<UnavailableTrackRow track={item as UnavailableTrack} columns={columnCount()} playlist={props.playlist} />}
				>{(music) => <tr>
						<td class="col-title">
							<div class="music-title">
								<MusicCover music={music} />
								<div class="music-title-text">
									<Button variant="text" onClick={() => void playMusic(music)}>{music.name}</Button>
									<Show when={shown("artists")}>
										<span class="music-title-artists">
											<ArtistsLinks artists={music.artists} providerUUID={music.providerUuid} />
										</span>
									</Show>
								</div>
							</div>
						</td>
						<Show when={shown("actions")}><td class="col-actions"><button onClick={() => void addToQueue(music)}>AddToQueue</button></td></Show>
						<Show when={shown("artists")}><td class="col-artists"><ArtistsLinks artists={music.artists} providerUUID={music.providerUuid} /></td></Show>
						<Show when={shown("album")}><td class="col-album">{music.hasAlbum() ? <A href={music.albumRoute()} class="white-variant">{music.album.name}</A> : "-"}</td></Show>
						<Show when={props.providers?.length}><td class="col-provider"><A href={`/provider/${music.providerUuid}`}>{props.providers?.find((provider) => provider.uuid === music.providerUuid)?.name}</A></td></Show>
						<Show when={shown("published")}><td class="col-published">{music.publishedAt ? toDate(music.publishedAt).toLocaleDateString() : "-"}</td></Show>
						<Show when={shown("duration")}><td class="col-duration">{formatTimer(music.duration)}</td></Show>
					</tr>}</Show>}</For>
			</tbody>
		</table>
	</div>;
}
