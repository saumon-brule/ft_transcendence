import { createMemo } from "solid-js";
import { createQueries } from "@tanstack/solid-query";
import type { PlaylistDetailDto } from "@flex/shared";
import { Music } from "~/class/Music";
import { getProviderClient } from "../providerClients";
import { buildTracks, chunkEntries, type Chunk, type ChunkResult } from "~/utils/playlistTracks";

type RawChunk
	= | { kind: "ok"; musics: Parameters<typeof Music.fromRawObject>[0][]; missing: string[] }
		| { kind: "restricted" };

async function fetchChunk(provider: { uuid: string; address: string }, uuids: string[]): Promise<RawChunk> {
	const res = await getProviderClient(provider.address, provider.uuid).client.music.getMany.mutation({ body: { uuids } });
	if (res.status === 200) return { kind: "ok", musics: res.body.musics, missing: res.body.missing };
	if (res.status === 403) return { kind: "restricted" };
	throw new Error(`Provider batch failed with status ${res.status}`);
}

export const usePlaylistTracks = (playlist: () => PlaylistDetailDto | undefined) => {
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
					musics: query.data.musics.map((music) => Music.fromRawObject(music, job.provider.address, job.provider.uuid)),
				};
			}
			return { providerUuid: job.providerUuid, uuids: job.uuids, result };
		});

		return buildTracks(current.musics, current.providers, chunks);
	});

	return { tracks, isLoading: () => tracks().some((track) => !(track instanceof Music) && track.state === "loading") };
};
