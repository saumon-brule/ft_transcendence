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
import { MusicGroup } from "~/store/trackManager.store";

export type MusicSectionColumn = "actions" | "artists" | "album" | "published" | "duration";

function isGroupMusicSection(props: MusicSectionProps | GroupMusicSectionProps): props is GroupMusicSectionProps {
	return "musicGroup" in props;
}

export type MusicSectionProps = {
	hiddenColumns?: MusicSectionColumn[];
	providers?: Provider[];
	musics: Array<Music>;
};

export type GroupMusicSectionProps = {
	hiddenColumns?: MusicSectionColumn[];
	providers?: Provider[];
	musicGroup: MusicGroup;
};

export default function MusicSection(props: MusicSectionProps | GroupMusicSectionProps) {
	const audioManager = useAudioManagerContext();
	const shown = (column: MusicSectionColumn) => !props.hiddenColumns?.includes(column);

	function toDate(value: Date | string): Date {
		return value instanceof Date ? value : new Date(value);
	}

	function handleMusicClick(index: number) {
		if (isGroupMusicSection(props)) {
			audioManager.setMusicGroup(props.musicGroup);
			audioManager.position = index;
		} else {
			audioManager.setCurrentMusic(props.musics[index]);
		}
		audioManager.play();
	}

	function addToQueue(music: Music) {
		audioManager.pushMusicToQueue(music);
	}

	const musicList = () => isGroupMusicSection(props) ? props.musicGroup.musics : props.musics;

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
				<For each={musicList()}>{(music, i) => <tr>
					<td class="col-title">
						<div class="music-title">
							<MusicCover music={music} />
							<div class="music-title-text">
								<Button variant="text" onClick={() => handleMusicClick(i())}>{music.name}</Button>
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
				</tr>}</For>
			</tbody>
		</table>
	</div>;
}
