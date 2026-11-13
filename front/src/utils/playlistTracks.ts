export const BATCH_SIZE = 100;

export type UnavailableState = "restricted" | "offline" | "missing" | "loading";

export interface PlaylistEntry {
	musicUuid: string;
	providerUuid: string;
}

export interface PlaylistProvider {
	uuid: string;
	name: string;
	address: string;
}

export interface UnavailableTrack {
	state: UnavailableState;
	musicUuid: string;
	provider: PlaylistProvider;
}

export type ChunkResult<T>
	= | { status: "pending" }
		| { status: "offline" }
		| { status: "restricted" }
		| { status: "ok"; musics: T[]; missing: string[] };

export interface Chunk<T> {
	providerUuid: string;
	uuids: string[];
	result: ChunkResult<T>;
}

export function chunkEntries(entries: PlaylistEntry[]) {
	const byProvider = new Map<string, Set<string>>();
	for (const entry of entries) {
		const uuids = byProvider.get(entry.providerUuid) ?? new Set<string>();
		uuids.add(entry.musicUuid);
		byProvider.set(entry.providerUuid, uuids);
	}

	return [...byProvider].flatMap(([providerUuid, uuids]) => {
		const all = [...uuids];
		return Array.from({ length: Math.ceil(all.length / BATCH_SIZE) }, (_, index) => ({
			providerUuid,
			uuids: all.slice(index * BATCH_SIZE, (index + 1) * BATCH_SIZE),
		}));
	});
}

export function buildTracks<T extends { uuid: string }>(
	entries: PlaylistEntry[],
	providers: PlaylistProvider[],
	chunks: Chunk<T>[],
): (T | UnavailableTrack)[] {
	const outcomes = new Map<string, T | UnavailableState>();
	const key = (providerUuid: string, musicUuid: string) => `${providerUuid}/${musicUuid}`;

	for (const { providerUuid, uuids, result } of chunks) {
		if (result.status === "ok") {
			for (const music of result.musics) outcomes.set(key(providerUuid, music.uuid), music);
			for (const uuid of uuids) {
				if (!outcomes.has(key(providerUuid, uuid))) outcomes.set(key(providerUuid, uuid), "missing");
			}
		} else {
			const state: UnavailableState = result.status === "pending"
				? "loading"
				: result.status;
			for (const uuid of uuids) outcomes.set(key(providerUuid, uuid), state);
		}
	}

	const providerByUuid = new Map(providers.map((provider) => [provider.uuid, provider]));
	return entries.map((entry) => {
		const outcome = outcomes.get(key(entry.providerUuid, entry.musicUuid)) ?? "loading";
		if (typeof outcome !== "string") return outcome;

		const provider = providerByUuid.get(entry.providerUuid) ?? { uuid: entry.providerUuid, name: "Unknown provider", address: "" };
		return { state: outcome, musicUuid: entry.musicUuid, provider };
	});
}
