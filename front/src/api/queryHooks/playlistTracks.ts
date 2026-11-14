import { createMemo } from "solid-js";
import { createQueries } from "@tanstack/solid-query";
import type { PlaylistDetailDto } from "@flex/shared";
import { Music, UnavailableMusic } from "~/class/Music";
import { getProviderClient } from "../providerClients";
import { buildMusics, chunkEntries, type Chunk, type ChunkResult } from "~/utils/playlistTracks";

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

function musicsOf(data: Extract<RawChunk, { kind: "ok" }>, provider: { uuid: string; name: string; address: string }) {
	let musics = musicsByData.get(data);
	if (!musics) {
		musics = data.musics.map((music) => Music.fromRawObject(music, provider));
		musicsByData.set(data, musics);
	}
	return musics;
}

export const usePlaylistMusics = (playlist: () => PlaylistDetailDto | undefined) => {
	const unavailableMusics = new Map<string, UnavailableMusic>();

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

	const musics = createMemo(() => {
		const current = playlist();
		if (!current) return [];

		const chunks = jobs().map((job, index): Chunk => {
			const query = results[index] as { data?: RawChunk; isError: boolean } | undefined;
			let result: ChunkResult = { status: "pending" };
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
		const stable = buildMusics(current.musics, current.providers, chunks).map((music) => {
			if (!music.isUnavailable()) return music;

			const key = `${music.state}|${music.provider.uuid}|${music.provider.name}|${music.provider.address}|${music.uuid}`;
			used.add(key);
			const known = unavailableMusics.get(key);
			if (known) return known;

			unavailableMusics.set(key, music);
			return music;
		});
		for (const key of unavailableMusics.keys()) if (!used.has(key)) unavailableMusics.delete(key);

		return stable;
	});

	return { musics, get isLoading() { return musics().some((music) => music.isLoading()); } };
};
