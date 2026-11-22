import { t } from "~/i18n/context";
import { Provider } from "@flex/shared";
import { Music, UnavailableMusicState } from "~/class/Music";

export const BATCH_SIZE = 100;

export interface PlaylistEntry {
	musicUuid: string;
	providerUuid: string;
}

export type ChunkResult
	= | { status: "pending" }
		| { status: "offline" }
		| { status: "restricted" }
		| { status: "ok"; musics: Music[]; missing: string[] };

export interface Chunk {
	providerUuid: string;
	uuids: string[];
	result: ChunkResult;
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

export function buildMusics(
	entries: PlaylistEntry[],
	providers: Provider[],
	chunks: Chunk[],
): Music[] {
	const outcomes = new Map<string, Music | UnavailableMusicState>();
	const key = (providerUuid: string, musicUuid: string) => `${providerUuid}/${musicUuid}`;

	for (const { providerUuid, uuids, result } of chunks) {
		if (result.status === "ok") {
			for (const music of result.musics) outcomes.set(key(providerUuid, music.uuid), music);
			for (const uuid of uuids) {
				if (!outcomes.has(key(providerUuid, uuid))) outcomes.set(key(providerUuid, uuid), "missing");
			}
		} else {
			const state: UnavailableMusicState = result.status === "pending"
				? "loading"
				: result.status;
			for (const uuid of uuids) outcomes.set(key(providerUuid, uuid), state);
		}
	}

	const providerByUuid = new Map(providers.map((provider) => [provider.uuid, provider]));
	return entries.map((entry) => {
		const outcome = outcomes.get(key(entry.providerUuid, entry.musicUuid)) ?? "loading";
		if (typeof outcome !== "string") return outcome;

		const provider = providerByUuid.get(entry.providerUuid) ?? { uuid: entry.providerUuid, name: t("common.unknownProvider"), address: "" };
		return Music.createUnavailable(entry.musicUuid, provider, outcome);
	});
}
