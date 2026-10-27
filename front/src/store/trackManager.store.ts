import { createEffect } from "solid-js";
import { createStore, produce } from "solid-js/store";
import z from "zod";
import { Music } from "~/class/Music";
import { Track } from "~/class/Track";

const MAX_HISTORY_SIZE = 64;


const trackManagerStateSchema = z.object({
	current: Track.zodSchema.nullable(),
	queue: z.array(Track.zodSchema),
	history: z.array(Track.zodSchema).max(MAX_HISTORY_SIZE).catch(() => []),
	progression: z.number(),
	activePlaylist: z.array(Track.zodSchema).nullable(),
});

type TrackManagerState = z.infer<typeof trackManagerStateSchema>;

const defaultTrackManagerState = {
	current: null,
	queue: [],
	history: [],
	progression: 0,
	activePlaylist: null,
};

function loadLocalTrackManagerState(): TrackManagerState {
	let data: unknown;
	try {
		const item = localStorage.getItem("track-state");
		if (!item) return defaultTrackManagerState;
		data = JSON.parse(item);
	} catch (e: unknown) {
		console.error(e);
		return defaultTrackManagerState;
	}
	const result = trackManagerStateSchema.safeParse(data);
	if (result.success) {
		return result.data;
	} else {
		return defaultTrackManagerState;
	}
}

export function useTrackManager() {
	const [trackManager, setTrackManager] = createStore<TrackManagerState>(loadLocalTrackManagerState());

	createEffect(() => {
		localStorage.setItem("track-state", JSON.stringify(trackManager));
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


	function setProgression(progression: number) {
		setTrackManager("progression", progression);
	}

	return {
		manager: trackManager,
		nextTrack: next,
		prevTrack: prev,
		setCurrentTrack,
		pushTrackToQueue,
		setProgression,
	};
}

export type PushTrackToQueueFn = ReturnType<typeof useTrackManager>["pushTrackToQueue"];
export type SetCurrentTrackFn = ReturnType<typeof useTrackManager>["setCurrentTrack"];
