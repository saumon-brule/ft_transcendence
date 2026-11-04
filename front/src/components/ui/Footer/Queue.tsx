import { Accessor, Setter, Show } from "solid-js";
import Button from "~/components/inputs/Button";
import { useAudioManagerContext } from "~/components/context/AudioManagerContext";
import MusicCover from "../MusicCover";
import TrackList from "../TrackList/TrackList";

import "./Queue.scss";
import ArtistsLinks from "../ArtistLinks";

export type QueueProps = {
	show: Accessor<boolean>;
	setShow: Setter<boolean>;
};

export default function Queue(props: QueueProps) {
	const audioManager = useAudioManagerContext();

	return <div id="queue" class={props.show() ? "show" : undefined}>
		<Button class="hide-queue-button" onClick={() => props.setShow(false)} />
		<div>
			<div class="queue-header">
				<h1>Queue</h1>
			</div>
			<div class="queue-body">
				<div class="current-track">
					<Show when={audioManager.currentMusic} fallback={<img src="/images/default_cover.png" />} keyed>
						{(currentMusic) => <MusicCover music={currentMusic} />}
					</Show>
					<h2 class="track-name">
						<Show when={audioManager.currentMusic} fallback="-" keyed>
							{(currentMusic) => currentMusic.name}
						</Show>
					</h2>
					<h3 class="track-name">
						<Show when={audioManager.currentMusic} fallback="-" keyed>
							{(currentMusic) => <ArtistsLinks artists={currentMusic.artists} providerUUID={currentMusic.providerUuid} />}
						</Show>
					</h3>
				</div>
				<div class="queue-list">
					<TrackList tracks={audioManager.queue}/>
				</div>
			</div>
		</div>
	</div>;
}
