import { useNavigate, useParams } from "@solidjs/router";
import { createEffect, Show } from "solid-js";
import { PlaylistRequestError, usePlaylistQuery } from "~/api/queryHooks/playlist";
import { usePlaylistTracks } from "~/api/queryHooks/playlistTracks";
import MusicSection from "~/components/ui/MusicSection/MusicSection";
import { summonErrorToast } from "~/components/ui/Toaster";
import PlaylistHeader from "./PlaylistHeader";
import "./Playlist.scss";

export default function Playlist() {
	const navigate = useNavigate();
	const params = useParams<{ uuid: string }>();
	const playlist = usePlaylistQuery(() => params.uuid);
	const { tracks } = usePlaylistTracks(() => playlist.data);

	createEffect(() => {
		if (!playlist.isError) return;

		if (playlist.error instanceof PlaylistRequestError && playlist.error.status === 404) {
			navigate("/home");
			summonErrorToast("Unknown playlist");
		} else {
			summonErrorToast("Failed to load the playlist");
		}
	});

	return <div class="page" id="playlist">
		<Show when={playlist.data} keyed>{(data) => <>
			<PlaylistHeader playlist={data} tracks={tracks()} />
			<section>
				<Show when={data.musics.length > 0} fallback={<p class="empty">This playlist is empty</p>}>
					<MusicSection
						music={{ musics: tracks(), total: tracks().length }}
						playlist={{ uuid: data.uuid, isOwner: data.isOwner }}
						providers={data.providers.map((provider) => ({ ...provider, publicDisplay: true }))}
					/>
				</Show>
			</section>
		</>}</Show>
	</div>;
}
