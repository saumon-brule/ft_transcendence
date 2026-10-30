import { useAudioManagerContext } from "~/components/context/AudioManagerContext";
import { Show } from "solid-js";
import MusicCover from "../MusicCover";
import ArtistsLinks from "../ArtistLinks";

import "./CurrentTrack.scss";
import { A } from "@solidjs/router";

export default function CurrentTrack() {
	const audioManager = useAudioManagerContext();

	return <div class="current-track">
		<Show when={audioManager.currentMusic} keyed>
			{(currentMusic) => <div class="track-display">
				<Show when={currentMusic.hasAlbum() && currentMusic} keyed fallback={<MusicCover music={currentMusic} />}>
					{(music) => <A href={music.albumRoute()} ><MusicCover music={currentMusic} /></A>}
				</Show>
				<div class="track-details">
					<div class="track-name">
						{currentMusic.name}
					</div>
					<div class="track-artists" >
						<ArtistsLinks artists={currentMusic.artists} providerUUID={currentMusic.providerUuid}/>
					</div>
				</div>
			</div>}
		</Show>
	</div>;
}
