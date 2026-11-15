import { useAudioManagerContext } from "~/components/context/AudioManagerContext";
import Button from "~/components/inputs/Button/Button";
import { Pause, Play, SkipForward } from "lucide-solid";
import { Show } from "solid-js";

import "./FloatingFooter.scss";

export type FloatingFooterProps = {
	hidden: boolean;
	onOpen: () => void;
};

export default function FloatingFooter(props: FloatingFooterProps) {
	const audioManager = useAudioManagerContext();

	return <Show when={audioManager.currentMusic} keyed>
		{(currentMusic) => <div class="floating-footer" classList={{ "hide": props.hidden }} onClick={() => props.onOpen()}>
			<Button icon size="sm" onClick={(e) => { e.stopPropagation(); audioManager.toggle(); }}>
				{audioManager.playing ? <Pause/> : <Play/>}
			</Button>
			<div class="floating-track-details">
				<div class="track-name">{currentMusic.name}</div>
				<div class="track-artists">
					{currentMusic.artists.length === 0 ? "-" : currentMusic.artists.map((artist) => artist.name).join(", ")}
				</div>
			</div>
			<Button icon size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); audioManager.forward(); }}>
				<SkipForward/>
			</Button>
		</div>}
	</Show>;
}
