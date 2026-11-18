import { createStore } from "solid-js/store";
import { env } from "~/env";

const [coverVersions, setCoverVersions] = createStore<Record<string, number>>({});

export function playlistCoverUrl(uuid: string): string {
	const version = coverVersions[uuid];
	const base = `${env.VITE_API_URL}/playlists/${uuid}/cover`;
	return version ? `${base}?v=${version}` : base;
}

export function bumpPlaylistCover(uuid: string) {
	setCoverVersions(uuid, Date.now());
}
