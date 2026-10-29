import { useAudioManagerContext } from "~/components/context/AudioManagerContext";
import { Show } from "solid-js";

import "./CurrentTrack.scss";

export default function CurrentTrack() {
	const audioManager = useAudioManagerContext();

	return <div class="current-track">
		<Show when={audioManager.currentMusic} keyed>
			{(currentMusic) => <p>
				{currentMusic.name}
			</p>}
		</Show>
	</div>;
}
