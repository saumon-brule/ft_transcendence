import { For, Show } from "solid-js";
import { A } from "@solidjs/router";
import type { User } from "@flex/shared";
import { env } from "~/env";

type PlaylistSectionProps = { playlists: User["ownedPlaylists"] };

export default function PlaylistSection(props: PlaylistSectionProps) {
	return <section class="playlists">
		<h3>Playlists</h3>
		<div class="playlists-list">
			<Show when={props.playlists.length > 0} fallback={<p class="no-providers">No owned playlists</p>}>
				<For each={props.playlists}>{(playlist) => <A class="playlist-card" href={`/playlist/${playlist.uuid}`}>
					<img src={`${env.VITE_API_URL}/playlists/${playlist.uuid}/cover`} alt="playlist logo" />
					<div class="playlist-info">
						<h4>{playlist.name}</h4>
						<p>{playlist._count.musics} musics</p>
					</div>
				</A>}</For>
			</Show>
		</div>
	</section>;
}
