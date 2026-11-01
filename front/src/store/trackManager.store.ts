import { createEffect, createSignal } from "solid-js";
import { createStore, produce } from "solid-js/store";
import z from "zod";
import { Music } from "~/class/Music";
import { Track } from "~/class/Track";
import { LocalStorageItem } from "~/utils/storageHelper";

const MAX_HISTORY_SIZE = 64;

const trackManagerStateSchema = z.object({
	current: Track.zodSchema.nullable(),
	queue: z.array(Track.zodSchema),
	history: z.array(Track.zodSchema).max(MAX_HISTORY_SIZE).catch(() => []),
	activePlaylist: z.array(Music.zodSchema).nullable(),
});

export type TrackManagerState = z.infer<typeof trackManagerStateSchema>;

const trackProgressionItem = new LocalStorageItem("track-progression", () => 0, JSON.stringify);
const trackStateItem = new LocalStorageItem<TrackManagerState>(
	"track-state",
	() => ({ current: null, queue: [], history: [], activePlaylist: null }),
	JSON.stringify,
	(stored, defaultFactory) => {
		try {
			return trackManagerStateSchema.parse(JSON.parse(stored));
		} catch (e: unknown) {
			console.error(e);
			return defaultFactory();
		}
	},
);

export function useTrackManager() {
	const [trackManager, setTrackManager] = createStore<TrackManagerState>(trackStateItem.get());
	const [progression, setProgression] = createSignal(trackProgressionItem.get());

	createEffect(() => {
		trackStateItem.set(trackManager);
	});

	createEffect(() => {
		trackProgressionItem.set(progression());
	});

	function next() {
		let nextTrack: Track | null = null;
		setTrackManager(produce((manager) => {
			if (manager.current != null) {
				if (manager.history.length >= MAX_HISTORY_SIZE) manager.history.shift();
				if (!manager.current.temporary) manager.history.push(manager.current);
				manager.current = manager.queue.shift() ?? null;

				nextTrack = manager.current;
			}
		}));
		return nextTrack;
	}

	function prev(): Track | null {
		let historyTrack: Track | null = null;
		setTrackManager(produce((manager) => {
			if (manager.history.length > 0) {
				if (manager.current) {
					manager.queue.unshift(manager.current);
				}
				manager.current = manager.history.pop() ?? null;
				historyTrack = manager.current;
			} else {
				historyTrack = null;
			}
		}));
		return historyTrack;
	}

	function setCurrentTrack(track: Track): void;
	function setCurrentTrack(music: Music): void;
	function setCurrentTrack(element: Music | Track): void {
		let track: Track;

		if (element instanceof Track) {
			track = element;
		} else {
			track = new Track(element);
		}

		setTrackManager(produce((manager) => {
			if (manager.current != null && !manager.current.temporary) {
				if (manager.history.length >= MAX_HISTORY_SIZE) manager.history.shift();
				manager.history.push(manager.current);
			}
			manager.current = track ?? null;
		}));
	}

	function pushTrackToQueue(track: Track): void;
	function pushTrackToQueue(music: Music): void;
	function pushTrackToQueue(element: Music | Track): void {
		let track: Track;

		if (element instanceof Track) {
			track = element;
		} else {
			track = new Track(element);
		}

		if (trackManager.current) {
			setTrackManager("queue", produce((queue) => queue.push(track)));
		} else {
			setTrackManager("current", track);
		}
	}

	return {
		manager: trackManager,
		get progression() { return progression(); },
		set progression(progression: number) { setProgression(progression); },
		nextTrack: next,
		prevTrack: prev,
		setCurrentTrack,
		pushTrackToQueue,
		setProgression,
	};
}

export type PushTrackToQueueFn = ReturnType<typeof useTrackManager>["pushTrackToQueue"];
export type SetCurrentTrackFn = ReturnType<typeof useTrackManager>["setCurrentTrack"];
