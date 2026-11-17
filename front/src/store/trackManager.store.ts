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

	function peekNext(): Music | null {
		if (trackManager.queue.length > 0) return trackManager.queue[0];
		const musics = trackManager.musicGroup?.musics;
		if (!musics || musics.length === 0) return null;
		if (trackManager.loop) return musics[(trackManager.position + 1) % musics.length];
		return musics[trackManager.position + 1] ?? null;
	}

	function prev() {
		let prevMusic: Music | null = null;
		setTrackManager(produce((manager) => {
			if (!manager.musicGroup) {
				prevMusic = null;
			} else if (manager.loop) {
				if (!manager.isCurrentTemporary) {
					const musicListLength = manager.musicGroup.musics.length;
					manager.position = (((manager.position - 1) % musicListLength) + musicListLength) % musicListLength;
				}
				prevMusic = manager.musicGroup.musics[manager.position];
			} else {
				if (manager.position > 0 && !manager.isCurrentTemporary) {
					manager.position -= 1;
					prevMusic = manager.musicGroup.musics[manager.position];
				} else if (manager.current === null) {
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
		setTrackManager(produce((manager) => {
			if (!manager.musicGroup || manager.musicGroup.musics.length === 0) {
				manager.position = 0;
				return;
			}
			manager.position = position;
			manager.current = manager.musicGroup.musics[position];
			manager.isCurrentTemporary = false;
		}));
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

	function pushMusicToQueueTop(music: Music): void {
		if (trackManager.current) {
			setTrackManager("queue", produce((queue) => queue.unshift(music)));
		} else {
			setTrackManager("current", music);
		}
	}

	function clearQueue(): void {
		setTrackManager("queue", []);
	}

	function shuffle(): void {
		setTrackManager(produce((manager) => {
			if (!manager.musicGroup) return;
			manager.musicGroup.musics = manager.musicGroup.musics.filter((music) => music !== manager.current);

			for (let i = manager.musicGroup.musics.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[manager.musicGroup.musics[i], manager.musicGroup.musics[j]] = [manager.musicGroup.musics[j], manager.musicGroup.musics[i]];
			}

			if (manager.current) manager.musicGroup.musics.unshift(manager.current);
			manager.position = 0;
		}));
	}

	function toggleLoop(): void {
		setTrackManager(produce((manager) => {
			manager.loop = !manager.loop;

			if (manager.loop && !manager.current) {
				next();
			}
		}));
	}


	return {
		manager: trackManager,
		get progression() { return progression(); },
		set progression(progression: number) { setProgression(progression); },
		nextTrack: next,
		peekNextTrack: peekNext,
		prevTrack: prev,
		setCurrentMusic,
		setPosition,
		setMusicGroup,
		setLoop,
		pushMusicToQueue,
		pushMusicToQueueTop,
		clearQueue,
		shuffle,
		toggleLoop,
	};
}

export type SetPositionFn = ReturnType<typeof useTrackManager>["setPosition"];
export type SetMusicGroupFn = ReturnType<typeof useTrackManager>["setMusicGroup"];
export type SetCurrentMusicFn = ReturnType<typeof useTrackManager>["setCurrentMusic"];
export type PushMusicToQueueFn = ReturnType<typeof useTrackManager>["pushMusicToQueue"];
export type PushMusicToQueueTopFn = ReturnType<typeof useTrackManager>["pushMusicToQueueTop"];
export type ClearQueueFn = ReturnType<typeof useTrackManager>["clearQueue"];
export type ShuffleFn = ReturnType<typeof useTrackManager>["shuffle"];
export type ToogleLoopFn = ReturnType<typeof useTrackManager>["toggleLoop"];
