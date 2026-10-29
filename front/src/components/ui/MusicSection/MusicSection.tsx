import { For, Show } from "solid-js";
import type { ProviderDataDto } from "@flex/shared";
import { useAudioManagerContext } from "~/components/context/AudioManagerContext";
import { useMediaToken } from "~/api/providerClients";
import { Music } from "~/class/Music";
import "./MusicSection.scss";
import { A } from "@solidjs/router";
import Button from "~/components/inputs/Button";
import { ProviderInfo } from "~/api/queryHooks/providerInfo";

function ArtistsLinks(props: { music: ProviderDataDto["music"]["musics"][number]; providerUUID: string }) {
	return <>{props.music.artists.length === 0
		? "-"
		: <For each={props.music.artists}>{(artist, index) => <>
			<A href={`/provider/${props.providerUUID}/artist/${artist.uuid}`} class="white-variant">{artist.name}</A>
			{index() < props.music.artists.length - 1 ? ", " : ""}
		</>}</For>
	}</>;
}

function MusicCover(props: { music: Music }) {
	const mediaToken = useMediaToken(() => props.music.providerUrl);

	const src = () => {
		const token = mediaToken();
		if (token && props.music.hasCover) return props.music.coverUrl(token);
		return "/images/default_cover.png";
	};

	return <img src={src()} alt={props.music.name} />;
}

export type MusicSectionColumn = "actions" | "artists" | "album" | "published" | "duration";

export type MusicSectionProps = {
	music: ProviderInfo["music"];
	hiddenColumns?: MusicSectionColumn[];
};

export default function MusicSection(props: MusicSectionProps) {
	const audioManager = useAudioManagerContext();
	const shown = (column: MusicSectionColumn) => !props.hiddenColumns?.includes(column);

	function toDate(value: Date | string): Date {
		return value instanceof Date ? value : new Date(value);
	}

	function formatDuration(duration: number): string {
		const minutes = Math.floor(duration / 60);
		const seconds = duration % 60;
		return `${minutes}:${seconds.toString().padStart(2, "0")}`;
	}

	function playMusic(music: Music) {
		audioManager.setCurrentTrack(music);
		audioManager.play();
	}

	function addToQueue(music: Music) {
		audioManager.pushTrackToQueue(music);
	}

	// function getCover(music: ProviderDataDto["music"]["musics"][number]) {
	// 	const token = mediaToken();
	// 	if (music.hasCover && token) {
	// 		return buildMediaUrl(props.providerURL, "musicCover", music.uuid, token);
	// 	}
	// }

	return <div class="music-section">
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
				<For each={props.music.musics}>{(music) => <tr>
					<td class="col-title">
						<div class="music-title">
							<MusicCover music={music} />
							<div class="music-title-text">
								<Button variant="text" onClick={() => void playMusic(music)}>{music.name}</Button>
								<Show when={shown("artists")}><span class="music-title-artists"><ArtistsLinks music={music} providerUUID={music.providerUuid} /></span></Show>
							</div>
						</div>
					</td>
					<Show when={shown("actions")}><td class="col-actions"><button onClick={() => void addToQueue(music)}>AddToQueue</button></td></Show>
					<Show when={shown("artists")}><td class="col-artists"><ArtistsLinks music={music} providerUUID={music.providerUuid} /></td></Show>
					<Show when={shown("album")}><td class="col-album">{music.album ? <A href={`/provider/${music.providerUuid}/album/${music.album.uuid}`} class="white-variant">{music.album.name}</A> : "-"}</td></Show>
					<Show when={shown("published")}><td class="col-published">{music.publishedAt ? toDate(music.publishedAt).toLocaleDateString() : "-"}</td></Show>
					<Show when={shown("duration")}><td class="col-duration">{formatDuration(music.duration)}</td></Show>
				</tr>}</For>
			</tbody>
		</table>
	</div>;
}
