import { createEffect, createResource, For, onCleanup } from "solid-js";
import type { ProviderDataDto } from "@flex/shared";
import { useAudioManagerContext } from "~/components/context/AudioManagerContext";
import { getMediaToken, getProviderClient } from "~/api/providerClients";
import { Music } from "~/class/Music";
import { buildMediaUrl } from "@flex/shared";
import { summonErrorToast } from "~/components/ui/Toaster";
import "./MusicSection.scss";
import { A } from "@solidjs/router";
import Button from "~/components/inputs/Button";

function ArtistsLinks(props: { music: ProviderDataDto["music"]["musics"][number]; providerUUID: string }) {
	return <>{props.music.artists.length === 0
		? "-"
		: <For each={props.music.artists}>{(artist, index) => <>
			<A href={`/provider/${props.providerUUID}/artist/${artist.uuid}`} class="white-variant">{artist.name}</A>
			{index() < props.music.artists.length - 1 ? ", " : ""}
		</>}</For>
	}</>;
}

export default function MusicSection(props: { music: ProviderDataDto["music"]; providerURL: string; providerUUID: string }) {
	const audioManager = useAudioManagerContext();
	const [mediaToken, { refetch }] = createResource(() => props.providerURL, getMediaToken);

	let refreshTimer: ReturnType<typeof setTimeout> | undefined;
	createEffect(() => {
		if (!mediaToken()) return;
		clearTimeout(refreshTimer);
		const expiresAt = getProviderClient(props.providerURL).mediaToken.expiresAt;
		const delay = expiresAt.getTime() - Date.now() - 30_000;
		refreshTimer = setTimeout(() => void refetch(), Math.max(delay, 0));
	});
	onCleanup(() => clearTimeout(refreshTimer));


	function toDate(value: Date | string): Date {
		return value instanceof Date ? value : new Date(value);
	}

	function formatDuration(duration: number): string {
		const minutes = Math.floor(duration / 60);
		const seconds = duration % 60;
		return `${minutes}:${seconds.toString().padStart(2, "0")}`;
	}

	async function getMusic(music: ProviderDataDto["music"]["musics"][number]) {
		const token = await getMediaToken(props.providerURL);
		if (!token) {
			summonErrorToast("Failed to get media token for provider");
			throw new Error("Failed to get media token for provider");
		}
		return new Music("", buildMediaUrl(props.providerURL, "audio", music.uuid, token));
	}

	async function playMusic(music: ProviderDataDto["music"]["musics"][number]) {
		try {
			const mus = await getMusic(music);
			audioManager.setCurrentTrack(mus);
			audioManager.play();
		} catch (_e) {}
	}

	async function addToQueue(music: ProviderDataDto["music"]["musics"][number]) {
		try {
			const mus = await getMusic(music);
			audioManager.pushTrackToQueue(mus);
		} catch (_e) {}
	}

	function getCover(music: ProviderDataDto["music"]["musics"][number]) {
		const token = mediaToken();
		if (music.hasCover && token) {
			return buildMediaUrl(props.providerURL, "musicCover", music.uuid, token);
		}
		return "/assets/images/default_cover.png";
	}

	return <div class="music-section">
		<table class="data">
			<thead>
				<tr>
					<th class="col-title" scope="col">Title</th>
					<th class="col-actions" scope="col">Actions</th>
					<th class="col-artists" scope="col">Artists</th>
					<th class="col-album" scope="col">Album</th>
					<th class="col-published" scope="col">Published</th>
					<th class="col-duration" scope="col">Duration</th>
				</tr>
			</thead>
			<tbody>
				<For each={props.music.musics}>{(music) => <tr>
					<td class="col-title">
						<div class="music-title">
							<img src={getCover(music)} alt={music.name} />
							<div class="music-title-text">
								<span><Button variant="text" onClick={() => void playMusic(music)}>{music.name}</Button></span>
								<span class="music-title-artists"><ArtistsLinks music={music} providerUUID={props.providerUUID} /></span>
							</div>
						</div>
					</td>
					<td class="col-actions"><button onClick={() => void addToQueue(music)}>AddToQueue</button></td>
					<td class="col-artists"><ArtistsLinks music={music} providerUUID={props.providerUUID} /></td>
					<td class="col-album">{music.album ? <A href={`/provider/${props.providerUUID}/album/${music.album.uuid}`} class="white-variant">{music.album.name}</A> : "-"}</td>
					<td class="col-published">{music.publishedAt ? toDate(music.publishedAt).toLocaleDateString() : "-"}</td>
					<td class="col-duration">{formatDuration(music.duration)}</td>
				</tr>}</For>
			</tbody>
		</table>
	</div>;
}
