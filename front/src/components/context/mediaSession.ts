import { AudioManager } from "./AudioManagerContext";

const DEFAULT_SEEK_OFFSET = 3; // seconds

export function setupMediaSession(audioManager: AudioManager, audio: HTMLAudioElement) {
	if (!("mediaSession" in navigator)) return;
	navigator.mediaSession.setActionHandler("play", () => {
		if (audio.paused) { audio.play().catch(() => {}); }
	});
	navigator.mediaSession.setActionHandler("pause", () => {
		if (!audio.paused) { audio.pause(); }
	});
	navigator.mediaSession.setActionHandler("stop", audioManager.stop);
	navigator.mediaSession.setActionHandler("seekbackward", (details) => {
		const offset = details.seekOffset ?? DEFAULT_SEEK_OFFSET;
		audio.currentTime = Math.max(audio.currentTime - offset, 0);
	});
	navigator.mediaSession.setActionHandler("seekforward", (details) => {
		const offset = details.seekOffset ?? DEFAULT_SEEK_OFFSET;
		audio.currentTime = Math.min(audio.currentTime + offset, audio.duration);
	});
	navigator.mediaSession.setActionHandler("seekto", (details) => {
		if (details.seekTime === undefined) return;
		if (details.fastSeek && "fastSeek" in audio) {
			audio.fastSeek(details.seekTime);
		} else {
			audio.currentTime = details.seekTime;
		}
	});
	navigator.mediaSession.setActionHandler("previoustrack", audioManager.back);
	navigator.mediaSession.setActionHandler("nexttrack", audioManager.forward);

	audio.addEventListener("play", () => {
		navigator.mediaSession.playbackState = "playing";
	});

	audio.addEventListener("pause", () => {
		navigator.mediaSession.playbackState = "paused";
	});

	audio.addEventListener("timeupdate", () => {
		if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;

		navigator.mediaSession.setPositionState({
			duration: audio.duration,
			playbackRate: audio.playbackRate,
			position: audio.currentTime,
		});
	});

	return () => {
		navigator.mediaSession.setActionHandler("pause", null);
		navigator.mediaSession.setActionHandler("play", null);
		navigator.mediaSession.setActionHandler("stop", null);
		navigator.mediaSession.setActionHandler("seekbackward", null);
		navigator.mediaSession.setActionHandler("seekforward", null);
		navigator.mediaSession.setActionHandler("seekto", null);
		navigator.mediaSession.setActionHandler("previoustrack", null);
		navigator.mediaSession.setActionHandler("nexttrack", null);
	};
}
