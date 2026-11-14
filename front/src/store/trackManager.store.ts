import { createEffect, createSignal } from "solid-js";
import { createStore, produce } from "solid-js/store";
import z from "zod";
import { Music } from "~/class/Music";
import { LocalStorageItem } from "~/utils/storageHelper";

const trackManagerStateSchema = z.object({
	current: Music.zodSchema.nullable(),
	isCurrentTemporary: z.boolean(),
	queue: z.array(Music.zodSchema),
	musicGroup: z.object({
		name: z.string(),
		route: z.string(),
		musics: z.array(Music.zodSchema),
	}).nullable(),
	position: z.number(),
	loop: z.boolean(),
});

export type TrackManagerState = z.infer<typeof trackManagerStateSchema>;
export type MusicGroup = NonNullable<TrackManagerState["musicGroup"]>;

const trackProgressionItem = new LocalStorageItem("track-progression", () => 0, JSON.stringify);
const trackStateItem = new LocalStorageItem<TrackManagerState>(
	"track-state",
	() => ({ current: null, isCurrentTemporary: false, queue: [], musicGroup: null, position: 0, loop: false }),
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
			nextMusic = manager.queue.shift() ?? null;
			if (!nextMusic) {
				if (!manager.musicGroup) {
					nextMusic = null;
				} else if (manager.loop) {
					manager.position = (manager.position + 1) % manager.musicGroup.musics.length;
					nextMusic = manager.musicGroup.musics[manager.position];
				} else {
					if (manager.position < manager.musicGroup.musics.length - 1) {
						manager.position += 1;
						nextMusic = manager.musicGroup.musics[manager.position];
					} else {
						nextMusic = null;
					}
				}
				manager.isCurrentTemporary = false;
			} else {
				manager.isCurrentTemporary = true;
			}
			manager.current = nextMusic;
		}));
		return nextMusic;
	}

	function prev() {
		let prevMusic: Music | null = null;
		setTrackManager(produce((manager) => {
			if (!manager.musicGroup) {
				prevMusic = null;
			} else if (manager.loop) {
				if (!manager.isCurrentTemporary) {
					manager.position = (manager.position - 1) % (manager.musicGroup.musics.length ?? 0);
				}
				prevMusic = manager.musicGroup.musics[manager.position];
			} else {
				if (!manager.isCurrentTemporary && manager.position > 0) {
					manager.position -= 1;
					prevMusic = manager.musicGroup.musics[manager.position];
				} else {
					prevMusic = null;
				}
			}
			manager.isCurrentTemporary = false;
			if (prevMusic) manager.current = prevMusic;
		}));
		return prevMusic;
	}

	function setCurrentMusic(music: Music): void {
		setTrackManager(produce((manager) => {
			manager.current = music;
			manager.isCurrentTemporary = true;
		}));
	}

	function setPosition(position: number) {
		if (!trackManager.musicGroup || trackManager.musicGroup.musics.length === 0) {
			setTrackManager("position", 0);
			return;
		}
		setTrackManager("position", position);
		setCurrentMusic(trackManager.musicGroup.musics[position]);
	}

	function setMusicGroup(musicGroup: MusicGroup): void {
		setTrackManager("musicGroup", { ...musicGroup, musics: [...musicGroup.musics] });
	}

	function setLoop(loop: boolean): void {
		setTrackManager("loop", loop);
	}

	function pushMusicToQueue(music: Music): void {
		if (trackManager.current) {
			setTrackManager("queue", produce((queue) => queue.push(music)));
		} else {
			setTrackManager(produce((manager) => {
				manager.current = music;
				return manager;
			}));
		}
	}

	function clearQueue(): void {
		setTrackManager("queue", []);
	}

	return {
		manager: trackManager,
		get progression() { return progression(); },
		set progression(progression: number) { setProgression(progression); },
		nextTrack: next,
		prevTrack: prev,
		setCurrentMusic,
		setPosition,
		setMusicGroup,
		setLoop,
		pushMusicToQueue,
		clearQueue,
	};
}

export type SetPositionFn = ReturnType<typeof useTrackManager>["setPosition"];
export type SetMusicGroupFn = ReturnType<typeof useTrackManager>["setMusicGroup"];
export type SetCurrentMusicFn = ReturnType<typeof useTrackManager>["setCurrentMusic"];
export type PushMusicToQueueFn = ReturnType<typeof useTrackManager>["pushMusicToQueue"];
export type ClearQueueFn = ReturnType<typeof useTrackManager>["clearQueue"];
