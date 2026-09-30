import { createContext, useContext, ParentComponent, createEffect, onCleanup, onMount, untrack } from "solid-js";
import { createSignal } from "solid-js";
import { Music } from "~/class/Music";
import { PushTrackToQueueFn, SetCurrentTrackFn, useTrackManager } from "~/store/trackManager.store";
import { setupMediaSession } from "./mediaSession";
import { Track } from "~/class/Track";

const BACK_TIMER_THRESHOLD = 3; // secondesw

export type AudioManager = {
	get playing(): boolean;
	get currentMusic(): Music | null;
	get duration(): number;
	get progression(): number;
	set progression(time: number);
	get history(): Array<Track>;
	play: () => void;
	pause: () => void;
	stop: () => void;
	toggle: () => void;
	forward: () => void;
	back: () => void;
	pushTrackToQueue: PushTrackToQueueFn;
	setCurrentTrack: SetCurrentTrackFn;
};

const AudioManagerContext = createContext<AudioManager>();

export const AudioPlayerProvider: ParentComponent = (props) => {
	const audio = new Audio();
	const trackManager = useTrackManager();
	const [isPlaying, setIsPlaying] = createSignal(false);
	const [duration, setDuration] = createSignal(0.0);

	function play() {
		audio.play().catch(() => setIsPlaying(false));
	}

	function pause() {
		audio.pause();
	}

	function stop() {
		audio.pause();
		audio.currentTime = 0;
	}

	function toggle() {
		if (audio.src === "") return;
		if (audio.paused) void audio.play().catch(() => {});
		else audio.pause();
	}

	function forward() {
		setIsPlaying(true);
		trackManager.nextTrack();
	}

	function back() {
		if (audio.currentTime > BACK_TIMER_THRESHOLD) {
			audio.currentTime = 0;
		} else {
			setIsPlaying(true);
			if (!trackManager.prevTrack()) audio.currentTime = 0;
		}
	}

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === " ") {
			e.preventDefault();
			toggle();
		} else if (e.key === "ArrowRight" && e.ctrlKey) forward();
		else if (e.key === "ArrowLeft" && e.ctrlKey) back();
	};
	const handlePlay = () => setIsPlaying(true);
	const handlePause = () => setIsPlaying(false);
	const handleEnded = () => trackManager.nextTrack();
	const handleTimeUpdate = () => trackManager.setProgression(audio.currentTime);
	const handleLoadedMetadata = () => setDuration(audio.duration);

	window.addEventListener("keydown", handleKeyDown);
	audio.addEventListener("play", handlePlay);
	audio.addEventListener("pause", handlePause);
	audio.addEventListener("ended", handleEnded);
	audio.addEventListener("timeupdate", handleTimeUpdate);
	audio.addEventListener("loadedmetadata", handleLoadedMetadata);

	onMount(() => {
		audio.addEventListener("loadedmetadata", (() => audio.currentTime = trackManager.manager.progression), { once: true });
		audio.src = trackManager.manager.current?.music.url().href ?? "";
	});

	createEffect(() => {
		const currentTrack = trackManager.manager.current;
		if (currentTrack !== null) {
			audio.src = currentTrack.music.url().href;
			if (untrack(isPlaying)) play();
		} else {
			audio.pause();
			audio.src = "";
			setDuration(0);
		}
	});

	const audioManager = {
		get playing() { return isPlaying(); },
		get currentMusic() { return trackManager.manager.current?.music ?? null; },
		get progression() { return trackManager.manager.progression; },
		set progression(time: number) { audio.currentTime = time; },
		get duration() { return duration(); },
		get history() { return trackManager.manager.history; },
		play,
		pause,
		stop,
		toggle,
		forward,
		back,
		pushTrackToQueue: trackManager.pushTrackToQueue,
		setCurrentTrack: trackManager.setCurrentTrack,
	};

	(window as (typeof window & { audioManager: typeof audioManager })).audioManager = audioManager;
	(window as (typeof window & { Music: typeof Music })).Music = Music;

	onMount(() => {
		const callback = setupMediaSession(audioManager, audio);

		if (callback) onCleanup(callback);

		onCleanup(() => {
			window.removeEventListener("keydown", handleKeyDown);
			audio.removeEventListener("play", handlePlay);
			audio.removeEventListener("pause", handlePause);
			audio.removeEventListener("ended", handleEnded);
			audio.removeEventListener("timeupdate", handleTimeUpdate);
			audio.removeEventListener("loadedmetadata", handleLoadedMetadata);

			audio.pause();
			audio.src = "";
			audio.load();
		});
	});

	return <AudioManagerContext.Provider value={audioManager} >
		{props.children}
	</AudioManagerContext.Provider>;
};

export function useAudioManagerContext() {
	const context = useContext(AudioManagerContext);

	if (!context) {
		throw new Error("useAudioPlayerContext must be used inside AudioPlayerProvider");
	}

	return context;
}
