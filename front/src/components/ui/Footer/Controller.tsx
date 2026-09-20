import { useAudioPlayerContext } from "~/components/context/AudioManagerContext";
import Button from "../Button";

import "./Controller.scss";
import MusicTimer from "~/components/common/MusicTimer/MusicTimer";

export default function Controller() {
	const audioManager = useAudioPlayerContext();

	// audioManager

	return <div class="controller">
		{audioManager.currentMusic?.path ?? ""}
		<div class="controller-buttons">
			<Button onClick={audioManager.back} size="sm">Back</Button>
			<Button onClick={audioManager.toggle} size="sm">{audioManager.playing ? "Pause" : "Play"}</Button>
			<Button onClick={audioManager.forward} size="sm">Forward</Button>
		</div>
		<MusicTimer time={audioManager.progression}/>/<MusicTimer time={audioManager.duration}/>
	</div>;
}
