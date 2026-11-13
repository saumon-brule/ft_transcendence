import { createMemo } from "solid-js";
import { createQueries } from "@tanstack/solid-query";
import type { PlaylistDetailDto } from "@flex/shared";
import { Music } from "~/class/Music";
import { getProviderClient } from "../providerClients";
import { buildTracks, chunkEntries, type Chunk, type ChunkResult, type UnavailableTrack } from "~/utils/playlistTracks";

type RawChunk
	= | { kind: "ok"; musics: Parameters<typeof Music.fromRawObject>[0][]; missing: string[] }
		| { kind: "restricted" };

async function fetchChunk(provider: { uuid: string; address: string }, uuids: string[]): Promise<RawChunk> {
	const res = await getProviderClient(provider.address, provider.uuid).client.music.getMany.mutation({ body: { uuids } });
	if (res.status === 200) return { kind: "ok", musics: res.body.musics, missing: res.body.missing };
	if (res.status === 403) return { kind: "restricted" };
	throw new Error(`Provider batch failed with status ${res.status}`);
}

const musicsByData = new WeakMap<RawChunk, Music[]>();

function musicsOf(data: Extract<RawChunk, { kind: "ok" }>, provider: { uuid: string; address: string }) {
	let musics = musicsByData.get(data);
	if (!musics) {
		musics = data.musics.map((music) => Music.fromRawObject(music, provider.address, provider.uuid));
		musicsByData.set(data, musics);
	}
	return musics;
}

export const usePlaylistTracks = (playlist: () => PlaylistDetailDto | undefined) => {
	const unavailableTracks = new Map<string, UnavailableTrack>();

	const jobs = createMemo(() => {
		const current = playlist();
		if (!current) return [];

		return chunkEntries(current.musics).flatMap((job) => {
			const provider = current.providers.find(({ uuid }) => uuid === job.providerUuid);
			return provider
				? [{ ...job, provider }]
				: [];
		});
	});

	const results = createQueries({
		get queries() {
			return jobs().map((job) => ({
				queryKey: () => ["provider", job.provider.uuid, "music", "batch", job.uuids.join(",")],
				queryFn: () => fetchChunk(job.provider, job.uuids),
				staleTime: 30_000,
				retry: 1,
			}));
		},
	});

	const tracks = createMemo(() => {
		const current = playlist();
		if (!current) return [];

		const chunks = jobs().map((job, index): Chunk<Music> => {
			const query = results[index] as { data?: RawChunk; isError: boolean } | undefined;
			let result: ChunkResult<Music> = { status: "pending" };
			if (query?.isError) {
				result = { status: "offline" };
			} else if (query?.data?.kind === "restricted") {
				result = { status: "restricted" };
			} else if (query?.data?.kind === "ok") {
				result = {
					status: "ok",
					missing: query.data.missing,
					musics: musicsOf(query.data, job.provider),
				};
			}
			return { providerUuid: job.providerUuid, uuids: job.uuids, result };
		});

		const used = new Set<string>();
		const stable = buildTracks(current.musics, current.providers, chunks).map((track) => {
			if (track instanceof Music) return track;

			const key = `${track.state}|${track.provider.uuid}|${track.provider.name}|${track.provider.address}|${track.musicUuid}`;
			used.add(key);
			const known = unavailableTracks.get(key);
			if (known) return known;

			unavailableTracks.set(key, track);
			return track;
		});
		for (const key of unavailableTracks.keys()) if (!used.has(key)) unavailableTracks.delete(key);

		return stable;
	});

	return { tracks, isLoading: () => tracks().some((track) => !(track instanceof Music) && track.state === "loading") };
};
