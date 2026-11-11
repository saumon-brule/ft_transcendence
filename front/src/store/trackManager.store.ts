import { createEffect, createSignal } from "solid-js";
import { createStore, produce } from "solid-js/store";
import z from "zod";
import { Music } from "~/class/Music";
import { LocalStorageItem } from "~/utils/storageHelper";

const trackManagerStateSchema = z.object({
	current: Music.zodSchema.nullable(),
	queue: z.array(Music.zodSchema),
	musicList: z.array(Music.zodSchema),
	positon: z.number(),
});

export type TrackManagerState = z.infer<typeof trackManagerStateSchema>;

const trackProgressionItem = new LocalStorageItem("track-progression", () => 0, JSON.stringify);
const trackStateItem = new LocalStorageItem<TrackManagerState>(
	"track-state",
	() => ({ current: null, queue: [], musicList: [], positon: 0 }),
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
		let nextMusic: Music | null = null;
		setTrackManager(produce((manager) => {
			nextMusic = manager.queue.shift() || null;
			if (!nextMusic) {
				if (manager.positon < manager.musicList.length) {
					manager.positon += 1;
					nextMusic = manager.musicList[manager.positon];
				} else {
					nextMusic = null;
				}
			}
			manager.current = nextMusic;
		}));
		return nextMusic;
	}

	function prev(): Music | null {
		let prevMusic: Music | null = null;
		setTrackManager(produce((manager) => {
			if (manager.positon > 0) {
				manager.positon -= 1;
				prevMusic = manager.musicList[manager.positon];
				manager.current = prevMusic;
			} else {
				prevMusic = null;
			}
		}));
		return prevMusic;
	}

	function setCurrentMusic(music: Music): void {
		setTrackManager(produce((manager) => {
			manager.current = music;
		}));
	}

	function pushMusicToQueue(music: Music): void {
		if (trackManager.current) {
			setTrackManager("queue", produce((queue) => queue.push(music)));
		} else {
			setTrackManager("current", music);
		}
	}

	return {
		manager: trackManager,
		get progression() { return progression(); },
		set progression(progression: number) { setProgression(progression); },
		nextTrack: next,
		prevTrack: prev,
		setCurrentMusic,
		pushMusicToQueue,
		setProgression,
	};
}

export type PushMusicToQueueFn = ReturnType<typeof useTrackManager>["pushMusicToQueue"];
export type SetCurrentMusicFn = ReturnType<typeof useTrackManager>["setCurrentMusic"];
