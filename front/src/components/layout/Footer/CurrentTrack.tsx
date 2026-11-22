import { useAudioManagerContext } from "~/components/context/AudioManagerContext";
import { Show } from "solid-js";
import MusicCover from "~/components/ui/elements/MusicCover";
import ArtistsLinks from "~/components/ui/elements/ArtistLinks";

import "./CurrentTrack.scss";
import { A } from "@solidjs/router";

export default function CurrentTrack() {
	const audioManager = useAudioManagerContext();

	return <div class="current-track">
		<Show when={audioManager.currentMusic} keyed fallback={
			<div class="track-display"><img src="/images/default_cover.webp"/><div class="track-details">
				<div class="track-name">-</div>
				<div class="track-artists" >-</div>
			</div></div>
		}>
			{(currentMusic) => <div class="track-display">
				<Show when={currentMusic.hasAlbum() && currentMusic} keyed fallback={<MusicCover music={currentMusic} />}>
					{(music) => <A class="album-link" href={music.albumRoute()} ><MusicCover music={currentMusic} /></A>}
				</Show>
				<div class="track-details">
					<div class="track-name">
						{currentMusic.name}
					</div>
					<div class="track-artists" >
						<ArtistsLinks artists={currentMusic.artists} providerUUID={currentMusic.provider.uuid}/>
					</div>
				</div>
			</div>}
		</Show>
	</div>;
}
