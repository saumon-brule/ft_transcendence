import { useAudioManagerContext } from "~/components/context/AudioManagerContext";
import Button from "~/components/inputs/Button";
import { MusicTimer } from "~/components/common/MusicTimer/MusicTimer";
import { Pause, Play, SkipBack, SkipForward, Square } from "lucide-solid";
import { createSignal, onCleanup } from "solid-js";
import { REM } from "~/utils/constants";

import "./Controller.scss";

function getProgressionPourcent(progressBar: HTMLDivElement, mouseX: number) {
	const { left, width } = progressBar.getBoundingClientRect();
	const elementMouseX = mouseX - left;

	return Math.min(Math.max((elementMouseX - 0.5 * REM) / (width - 1 * REM), 0), 1);
}

export default function Controller() {
	const audioManager = useAudioManagerContext();
	const [mouseMoveProgression, setMouseMoveProgression] = createSignal<number | null>(null);
	let progressBarRef!: HTMLDivElement;
	let wasPlaying: boolean = false;

	const musicSelected = () => (audioManager.currentMusic !== null);
	const displayedProgression = () => (mouseMoveProgression() ?? (audioManager.progression / audioManager.duration));
	const displayedProgressionTime = () => {
		const progression = mouseMoveProgression();
		return progression ? progression * audioManager.duration : audioManager.progression;
	};

	function handleMouseMove(e: MouseEvent) {
		e.preventDefault();
		if (audioManager.playing) audioManager.pause();
		setMouseMoveProgression(getProgressionPourcent(progressBarRef, e.clientX));
	}

	function handleMouseUp(e: MouseEvent) {
		e.preventDefault();
		document.removeEventListener("mousemove", handleMouseMove);
		document.removeEventListener("mouseup", handleMouseUp);
		const currentMouseMoveProgression = mouseMoveProgression();
		if (currentMouseMoveProgression !== null) {
			audioManager.progression = currentMouseMoveProgression * audioManager.duration;
			setMouseMoveProgression(null);
		}
		if (wasPlaying) audioManager.play();
		wasPlaying = false;
	}

	function handleMouseDown(e: MouseEvent) {
		e.preventDefault();
		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);
		if (audioManager.playing) audioManager.pause();
		setMouseMoveProgression(getProgressionPourcent(progressBarRef, e.clientX));
		wasPlaying = audioManager.playing;
	}

	onCleanup(() => {
		document.removeEventListener("mousemove", handleMouseMove);
		document.removeEventListener("mouseup", handleMouseUp);
	});


	return <div class={"controller"}>
		<div class="controller-buttons">
			<Button disabled={audioManager.history.length === 0} class="controller" onClick={audioManager.back} size="sm" ><SkipBack/></Button>
			<Button disabled={!musicSelected()} class="controller" onClick={audioManager.toggle} size="sm">{musicSelected() ? audioManager.playing ? <Pause/> : <Play/> : <Square/>}</Button>
			<Button disabled={!musicSelected()} class="controller" onClick={audioManager.forward} size="sm"><SkipForward/></Button>
		</div>
		<div class={`progression${musicSelected() ? "" : " disabled"}`} style={{ "--progression-bar": `${displayedProgression()}` }}>
			<MusicTimer time={displayedProgressionTime()} />
			<div ref={progressBarRef} class="progression-bar" onMouseDown={handleMouseDown}><div/><button><span /></button></div>
			<MusicTimer time={audioManager.duration} />
		</div>
	</div>;
}
