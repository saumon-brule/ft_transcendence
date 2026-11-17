import { createStore, produce, unwrap } from "solid-js/store";
import z from "zod";
import { Album } from "~/class/Album";
import { Artist } from "~/class/Artist";
import { Music } from "~/class/Music";
import { LocalStorageItem } from "~/utils/storageHelper";

const HISTORY_SIZE = 3;

const historySchema = z.object({
	lastAlbums: z.array(Album.zodSchema),
	albumPlayCounts: z.record(z.string(), z.object({ amount: z.number(), album: Album.zodSchema })),
	lastArtists: z.array(Artist.zodSchema),
	artistPlayCounts: z.record(z.string(), z.object({ amount: z.number(), artist: Artist.zodSchema })),
	lastMusics: z.array(Music.zodSchema),
	musicPlayCounts: z.record(z.string(), z.object({ amount: z.number(), music: Music.zodSchema })),
});

type HistoryStore = z.output<typeof historySchema>;

const historyItem = new LocalStorageItem<HistoryStore>(
	"history",
	() => ({ lastAlbums: [], albumPlayCounts: {}, lastArtists: [], artistPlayCounts: {}, lastMusics: [], musicPlayCounts: {} }),
	JSON.stringify,
	(stored) => historySchema.parse(JSON.parse(stored)),
);

const [historyStore, setHistoryStore] = createStore<HistoryStore>(historyItem.get());

const history = {
	album: {
		listen: (album: Album) => {
			setHistoryStore(
				produce((s) => {
					s.lastAlbums = [album, ...s.lastAlbums.filter((a) => a.uuid !== album.uuid)].slice(0, HISTORY_SIZE);

					const entry = s.albumPlayCounts[album.uuid];
					if (entry) {
						entry.amount++;
						entry.album = album;
					} else {
						s.albumPlayCounts[album.uuid] = { amount: 1, album };
					}
				}),
			);
			historyItem.set(unwrap(historyStore));
		},
		last: (): Album[] => {
			return historyStore.lastAlbums;
		},
		top: (): Album[] => {
			return Object.values(historyStore.albumPlayCounts)
				.sort((a, b) => b.amount - a.amount)
				.slice(0, HISTORY_SIZE)
				.map((e) => e.album);
		},
	},
	artist: {
		listen: (artist: Artist) => {
			setHistoryStore(
				produce((s) => {
					s.lastArtists = [artist, ...s.lastArtists.filter((a) => a.uuid !== artist.uuid)].slice(0, HISTORY_SIZE);

					const entry = s.artistPlayCounts[artist.uuid];
					if (entry) {
						entry.amount++;
						entry.artist = artist;
					} else {
						s.artistPlayCounts[artist.uuid] = { amount: 1, artist };
					}
				}),
			);
			historyItem.set(unwrap(historyStore));
		},
		last: (): Artist[] => {
			return historyStore.lastArtists;
		},
		top: (): Artist[] => {
			return Object.values(historyStore.artistPlayCounts)
				.sort((a, b) => b.amount - a.amount)
				.slice(0, HISTORY_SIZE)
				.map((e) => e.artist);
		},
	},
	music: {
		listen: (music: Music) => {
			setHistoryStore(
				produce((s) => {
					s.lastMusics = [music, ...s.lastMusics.filter((a) => a.uuid !== music.uuid)].slice(0, HISTORY_SIZE);

					const entry = s.musicPlayCounts[music.uuid];
					if (entry) {
						entry.amount++;
						entry.music = music;
					} else {
						s.musicPlayCounts[music.uuid] = { amount: 1, music };
					}
				}),
			);
			historyItem.set(unwrap(historyStore));
		},
		last: (): Music[] => {
			return historyStore.lastMusics;
		},
		top: (): Music[] => {
			return Object.values(historyStore.musicPlayCounts)
				.sort((a, b) => b.amount - a.amount)
				.slice(0, HISTORY_SIZE)
				.map((e) => e.music);
		},
	},
};

export { history };
