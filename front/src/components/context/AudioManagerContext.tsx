import { createContext, useContext, ParentComponent, createEffect, onCleanup, Accessor } from "solid-js";
import { createSignal } from "solid-js";
import { Music } from "~/class/Music";
import { PushTrackToQueueFn, SetCurrentTrackFn, useTrackManager } from "~/store/trackManager.store";

type AudioManagerContextValue = {
	playing: Accessor<boolean>;
	currentMusic: Accessor<Music | null>;
	duration: Accessor<number>;
	progression: Accessor<number>;
	play: () => Promise<void>;
	pause: () => void;
	toggle: () => void;
	forward: () => void;
	back: () => void;
	pushTrackToQueue: PushTrackToQueueFn;
	setCurrentTrack: SetCurrentTrackFn;
};

const AudioManagerContext = createContext<AudioManagerContextValue>();

export const AudioPlayerProvider: ParentComponent = (props) => {
	const player = new Audio();
	const trackManager = useTrackManager();
	const [playing, setIsPlaying] = createSignal(false);
	const [duration, setDuration] = createSignal(0.0);

	function play() {
		return player.play();
	}

	function pause() {
		return player.pause();
	}

	function toggle() {
		if (player.paused) void player.play();
		else player.pause();
	}

	function forward() {
		return trackManager.nextTrack();
	}

	function back() {
		if (player.currentTime > 3) {
			player.currentTime = 0;
		} else {
			trackManager.prevTrack();
		}
	}

	window.addEventListener("keypress", (e) => {
		if (e.key === " ") {
			toggle();
		}
	});

	const handlePlay = () => setIsPlaying(true);
	const handlePause = () => setIsPlaying(false);
	const handleTimeUpdate = () => trackManager.setProgression(player.currentTime);
	const handleLoadedMetadata = () => setDuration(player.duration);

	player.addEventListener("play", handlePlay);
	player.addEventListener("pause", handlePause);
	player.addEventListener("timeupdate", handleTimeUpdate);
	player.addEventListener("loadedmetadata", handleLoadedMetadata);

	createEffect(() => {
		if (trackManager.manager.current !== null) {
			player.src = trackManager.manager.current.music.url().href;
			void player.play();
		} else {
			player.pause();
		}
	});

	onCleanup(() => {
		player.removeEventListener("play", handlePlay);
		player.removeEventListener("pause", handlePause);
		player.removeEventListener("timeupdate", handleTimeUpdate);
		player.removeEventListener("loadedmetadata", handleLoadedMetadata);

		player.pause();
		player.src = "";
		player.load();
	});

	(window as typeof window & { setCurrentTrack: SetCurrentTrackFn }).setCurrentTrack = trackManager.setCurrentTrack;
	(window as typeof window & { pushTrackToQueue: PushTrackToQueueFn }).pushTrackToQueue = trackManager.pushTrackToQueue;
	(window as typeof window & { Music: typeof Music }).Music = Music;

	return <AudioManagerContext.Provider value={{
		playing,
		currentMusic: () => (trackManager.manager.current?.music ?? null),
		progression: () => trackManager.manager.progression,
		duration,
		play,
		pause,
		toggle,
		forward,
		back,
		pushTrackToQueue: trackManager.pushTrackToQueue,
		setCurrentTrack: trackManager.setCurrentTrack,
	}} >
		{props.children}
	</AudioManagerContext.Provider>;
};

export function useAudioPlayerContext() {
	const context = useContext(AudioManagerContext);

	if (!context) {
		throw new Error("useAudioPlayerContext must be used inside AudioPlayerProvider");
	}

	return context;
}
