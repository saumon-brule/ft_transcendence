import { createStore, produce, unwrap } from "solid-js/store";
import z from "zod";
import { Album } from "~/class/Album";
import { Artist } from "~/class/Artist";
import { Music } from "~/class/Music";
import { Playlist } from "~/class/Playlist";
import { LocalStorageItem } from "~/utils/storageHelper";

const HISTORY_SIZE = 3;

const historySchema = z.object({
	lastAlbums: z.array(Album.zodSchema),
	albumPlayCounts: z.record(z.string(), z.object({ amount: z.number(), album: Album.zodSchema })),
	lastArtists: z.array(Artist.zodSchema),
	artistPlayCounts: z.record(z.string(), z.object({ amount: z.number(), artist: Artist.zodSchema })),
	lastMusics: z.array(Music.zodSchema),
	musicPlayCounts: z.record(z.string(), z.object({ amount: z.number(), music: Music.zodSchema })),
	lastPlaylists: z.array(Playlist.zodSchema).default([]),
	playlistPlayCounts: z.record(z.string(), z.object({ amount: z.number(), playlist: Playlist.zodSchema })).default({}),
});

type HistoryStore = z.output<typeof historySchema>;

const historyItem = new LocalStorageItem<HistoryStore>(
	"history",
	() => ({ lastAlbums: [], albumPlayCounts: {}, lastArtists: [], artistPlayCounts: {}, lastMusics: [], musicPlayCounts: {}, lastPlaylists: [], playlistPlayCounts: {} }),
	JSON.stringify,
	(stored) => historySchema.parse(JSON.parse(stored)),
);

const [historyStore, setHistoryStore] = createStore<HistoryStore>(historyItem.get());

function bumpArtist(s: HistoryStore, artist: Artist, weight: number, direct: boolean) {
	if (direct) {
		s.lastArtists = [artist, ...s.lastArtists.filter((a) => a.uuid !== artist.uuid)].slice(0, HISTORY_SIZE);
	}

	const entry = s.artistPlayCounts[artist.uuid];
	if (entry) {
		entry.amount += weight;
		entry.artist = artist;
	} else {
		s.artistPlayCounts[artist.uuid] = { amount: weight, artist };
	}
}

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

					for (const raw of album.artists) {
						bumpArtist(s, Artist.fromRawObject(raw, album.providerUrl, album.providerUuid), 0.7, false);
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
			setHistoryStore(produce((s) => bumpArtist(s, artist, 1, true)));
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

					for (const raw of music.artists) {
						bumpArtist(s, Artist.fromRawObject(raw, music.provider.address, music.provider.uuid), 0.1, false);
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
	playlist: {
		listen: (playlist: Playlist) => {
			setHistoryStore(
				produce((s) => {
					s.lastPlaylists = [playlist, ...s.lastPlaylists.filter((p) => p.uuid !== playlist.uuid)].slice(0, HISTORY_SIZE);

					const entry = s.playlistPlayCounts[playlist.uuid];
					if (entry) {
						entry.amount++;
						entry.playlist = playlist;
					} else {
						s.playlistPlayCounts[playlist.uuid] = { amount: 1, playlist };
					}
				}),
			);
			historyItem.set(unwrap(historyStore));
		},
		last: (): Playlist[] => {
			return historyStore.lastPlaylists;
		},
		top: (): Playlist[] => {
			return Object.values(historyStore.playlistPlayCounts)
				.sort((a, b) => b.amount - a.amount)
				.slice(0, HISTORY_SIZE)
				.map((e) => e.playlist);
		},
	},
	top: (): (Music | Album | Artist | Playlist)[] => {
		return [
			...Object.values(historyStore.musicPlayCounts)
				.sort((a, b) => b.amount - a.amount)
				.slice(0, HISTORY_SIZE * 2),
			...Object.values(historyStore.albumPlayCounts),
			...Object.values(historyStore.artistPlayCounts),
			...Object.values(historyStore.playlistPlayCounts),
		].sort((a, b) => b.amount - a.amount).slice(0, HISTORY_SIZE * 4)
			.map((e) => {
				if ("music" in e) return e.music;
				else if ("artist" in e) return e.artist;
				else if ("playlist" in e) return e.playlist;
				return e.album;
			});
	},
	last: (): (Music | Album | Artist | Playlist)[] => {
		return [
			...historyStore.lastArtists,
			...historyStore.lastMusics,
			...historyStore.lastAlbums,
			...historyStore.lastPlaylists,
		];
	},
};

export { history };
