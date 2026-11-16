import { useNavigate, useParams } from "@solidjs/router";
import { createEffect, Show } from "solid-js";
import { usePlaylistQuery } from "~/api/queryHooks/playlist";
import { usePlaylistMusics } from "~/api/queryHooks/playlistTracks";
import MusicSection from "~/components/ui/MusicSection/MusicSection";
import { summonErrorToast } from "~/components/ui/Toaster";
import PlaylistHeader from "./PlaylistHeader";
import "./Playlist.scss";

export default function Playlist() {
	const navigate = useNavigate();
	const params = useParams<{ uuid: string }>();
	const playlistQuery = usePlaylistQuery(() => params.uuid);
	const { musics: musics } = usePlaylistMusics(() => playlistQuery.data?.body);

	createEffect(() => {
		if (!playlistQuery.isError) return;

		if (playlistQuery.error.status === 404) {
			navigate("/home");
			summonErrorToast("Unknown playlist");
		} else {
			summonErrorToast("Failed to load the playlist");
		}
	});


	return <div class="page" id="playlist">
		<Show when={playlistQuery.data?.body} keyed>{(playlist) => {
			const musicGroup = { name: playlist.name, get musics() { return musics(); }, route: `/playlist/${playlist.uuid}` };

			return <>
				<PlaylistHeader playlist={playlist} musicGroup={musicGroup} />
				<section>
					<Show when={playlist.musics.length > 0} fallback={<p class="empty">This playlist is empty</p>}>
						<MusicSection
							musicGroup={musicGroup}
							playlist={{ uuid: playlist.uuid, isOwner: playlist.isOwner }}
							providers={playlist.providers.map((provider) => ({ ...provider, publicDisplay: true }))}
						/>
					</Show>
				</section>
			</>;
		}}</Show>
	</div>;
}
