import { AudioManager } from "./AudioManagerContext";
import { Music } from "~/class/Music";

const DEFAULT_SEEK_OFFSET = 3; // seconds
const DEFAULT_COVER = "/images/default_cover.webp";

const NOW_PLAYING_KEYS = ["flexTitle", "flexArtists", "flexAlbum", "flexPaused", "flexPosition", "flexDuration"] as const;

function clearNowPlaying() {
	const { dataset } = document.documentElement;
	for (const key of NOW_PLAYING_KEYS) delete dataset[key];
}

export function updateMediaMetadata(music: Music | null, token: string | null) {
	if (!music) {
		clearNowPlaying();
		if ("mediaSession" in navigator) navigator.mediaSession.metadata = null;
		return;
	}

	const { dataset } = document.documentElement;
	dataset.flexTitle = music.name;
	dataset.flexArtists = music.artists.map((artist) => artist.name).join(", ");
	dataset.flexAlbum = music.album?.name ?? "";

	if (!("mediaSession" in navigator)) return;

	const cover = token && music.hasCover ? music.coverUrl(token) : DEFAULT_COVER;
	navigator.mediaSession.metadata = new MediaMetadata({
		title: music.name,
		artist: music.artists.map((artist) => artist.name).join(", "),
		album: music.album?.name ?? "",
		artwork: [{ src: new URL(cover, window.location.origin).href }],
	});
}

function exposePlaybackState(audio: HTMLAudioElement) {
	const { dataset } = document.documentElement;
	const onPlay = () => { dataset.flexPaused = "false"; };
	const onPause = () => { dataset.flexPaused = "true"; };
	const onTime = () => {
		if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
		dataset.flexPosition = String(Math.floor(audio.currentTime));
		dataset.flexDuration = String(Math.floor(audio.duration));
	};
	const events = [["play", onPlay], ["pause", onPause], ["timeupdate", onTime], ["seeked", onTime], ["loadedmetadata", onTime]] as const;

	dataset.flexPaused = String(audio.paused);
	for (const [event, handler] of events) audio.addEventListener(event, handler);
	return () => {
		for (const [event, handler] of events) audio.removeEventListener(event, handler);
		clearNowPlaying();
	};
}

export function setupMediaSession(audioManager: AudioManager, audio: HTMLAudioElement) {
	const cleanupPlaybackState = exposePlaybackState(audio);
	if (!("mediaSession" in navigator)) return cleanupPlaybackState;
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
		cleanupPlaybackState();
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
