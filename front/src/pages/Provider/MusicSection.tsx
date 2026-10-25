import { For, Show } from "solid-js";
import type { ProviderDataDto, Provider } from "@flex/shared";
import { useAudioManagerContext } from "~/components/context/AudioManagerContext";
import { getProviderClient, refreshProviderMediaToken } from "~/api/providerClients";
import { Music } from "~/class/Music";
import { buildMediaUrl } from "@flex/shared";

export default function MusicSection(props: { music: ProviderDataDto["music"]; providerURL: string }) {
	const audioManager = useAudioManagerContext();

	function toDate(value: Date | string): Date {
		return value instanceof Date ? value : new Date(value);
	}

	function formatDuration(duration: number): string {
		const minutes = Math.floor(duration / 60);
		const seconds = duration % 60;
		return `${minutes}:${seconds.toString().padStart(2, "0")}`;
	}

	async function playMusic(providerURL: string, music: ProviderDataDto["music"]["musics"][number]) {
		console.log(`Playing music: ${music.name} from provider: ${providerURL}`);

		const provider = getProviderClient(providerURL);
		if (!provider.mediaToken.token || provider.mediaToken.expiresAt < new Date()) {
			await refreshProviderMediaToken(providerURL).then(() => {}).catch((error) => {
				console.log("trop nul", error);
			});
		}
		const mus = new Music(providerURL, buildMediaUrl("audio", music.uuid, provider.mediaToken.token));
		console.log(mus.url());
		audioManager.pushTrackToQueue(mus);
		audioManager.play();
	}

	return <div class="music-section">
		<table class="data">
			<thead>
				<tr>
					<th scope="col">Title</th>
					<th scope="col">Actions</th>
					<th scope="col">Artists</th>
					<th scope="col">Album</th>
					<th scope="col">Published</th>
					<th scope="col">Duration</th>
				</tr>
			</thead>
			<tbody>
				<For each={props.music.musics}>{(music) => <tr>
					<td>{music.name}</td>
					<td><button onClick={() => playMusic(props.providerURL, music)}>Play</button></td>
					<td>{music.artists.map((artist) => artist.name).join(", ")}</td>
					<td>{music.album ? music.album.name : "-"}</td>
					<td>{music.publishedAt ? toDate(music.publishedAt).toLocaleDateString() : "-"}</td>
					<td>{formatDuration(music.duration)}</td>
				</tr>}</For>
			</tbody>
		</table>
	</div>;
}
