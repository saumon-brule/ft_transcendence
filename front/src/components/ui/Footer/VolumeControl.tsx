import { useAudioManagerContext } from "~/components/context/AudioManagerContext";
import { Match, onCleanup, Switch } from "solid-js";

import "./VolumeControl.scss";
import { Volume, Volume1, Volume2, VolumeOff, VolumeX } from "lucide-solid";

function interpolateValue(slider: HTMLDivElement, mouseX: number) {
	const { left, width } = slider.getBoundingClientRect();
	const elementMouseX = mouseX - left - 2; // "- 2" for the slider width and padding to center the handle
	return Math.min(Math.max(elementMouseX / (width - 4), 0), 1); // "- 4" for same reasons as above
}

export default function VolumeControl() {
	const audioManager = useAudioManagerContext();
	let slider!: HTMLDivElement;

	function handleMouseMove(e: MouseEvent) {
		e.preventDefault();
		audioManager.volume = interpolateValue(slider, e.clientX);
	}

	function handleMouseUp(e: MouseEvent) {
		e.preventDefault();
		document.removeEventListener("mousemove", handleMouseMove);
		document.removeEventListener("mouseup", handleMouseUp);
		audioManager.volume = interpolateValue(slider, e.clientX);
	}

	function handleMouseDown(e: MouseEvent) {
		e.preventDefault();
		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);
		audioManager.volume = interpolateValue(slider, e.clientX);
	}

	onCleanup(() => {
		document.removeEventListener("mousemove", handleMouseMove);
		document.removeEventListener("mouseup", handleMouseUp);
	});

	return <div class="volume-control">
		<Switch>
			<Match when={audioManager.muted} >
				<VolumeOff onClick={() => { audioManager.muted = false; }} />
			</Match>
			<Match when={audioManager.volume == 0} >
				<VolumeX onClick={() => { audioManager.muted = true; }} />
			</Match>
			<Match when={audioManager.volume < 0.15} >
				<Volume onClick={() => { audioManager.muted = true; }} />
			</Match>
			<Match when={audioManager.volume >= 0.15 && audioManager.volume < 0.6} >
				<Volume1 onClick={() => { audioManager.muted = true; }} />
			</Match>
			<Match when={audioManager.volume >= 0.6} >
				<Volume2 onClick={() => { audioManager.muted = true; }} />
			</Match>
		</Switch>
		<div class="slider" ref={slider} onMouseDown={handleMouseDown} style={{ "--slider-pos": `${audioManager.volume * 100}%` }}>
			<div class="slider-background"/>
			<div class="slider-bar">
				<div class="slider-handle"/>
			</div>
		</div>
	</div>;
}
