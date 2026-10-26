import { createEffect, createResource, For, onCleanup } from "solid-js";
import type { ProviderDataDto } from "@flex/shared";
import { useAudioManagerContext } from "~/components/context/AudioManagerContext";
import { getMediaToken, getProviderClient } from "~/api/providerClients";
import { Music } from "~/class/Music";
import { buildMediaUrl } from "@flex/shared";
import { summonErrorToast } from "~/components/ui/Toaster";
import "./MusicSection.scss";

export default function MusicSection(props: { music: ProviderDataDto["music"]; providerURL: string }) {
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

	function formatArtists(music: ProviderDataDto["music"]["musics"][number]): string {
		return music.artists.map((artist) => artist.name).join(", ");
	}

	async function playMusic(music: ProviderDataDto["music"]["musics"][number]) {
		console.log(`Playing music: ${music.name} from provider: ${props.providerURL}`);

		const token = await getMediaToken(props.providerURL);
		if (!token) {
			summonErrorToast("Failed to get media token for provider");
			return;
		}

		const mus = new Music("", buildMediaUrl(props.providerURL, "audio", music.uuid, token));
		console.log(mus.url());
		audioManager.pushTrackToQueue(mus);
		audioManager.play();
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
								<span>{music.name}</span>
								<span class="music-title-artists">{formatArtists(music)}</span>
							</div>
						</div>
					</td>
					<td class="col-actions"><button onClick={() => void playMusic(music)}>Play</button></td>
					<td class="col-artists">{formatArtists(music)}</td>
					<td class="col-album">{music.album ? music.album.name : "-"}</td>
					<td class="col-published">{music.publishedAt ? toDate(music.publishedAt).toLocaleDateString() : "-"}</td>
					<td class="col-duration">{formatDuration(music.duration)}</td>
				</tr>}</For>
			</tbody>
		</table>
	</div>;
}
