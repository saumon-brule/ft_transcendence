import { createMemo } from "solid-js";
import { useSearchParams } from "@solidjs/router";
import type { SearchFilters } from "~/api/queryHooks/providerInfo";
import type { SearchSortField } from "@flex/shared";
import type { Tab } from "./Search";

export type SearchFilterField = keyof SearchFilters;

export const SEARCH_FILTER_FIELDS = ["music", "artist", "album", "dateAfter", "dateBefore"] as const satisfies readonly SearchFilterField[];

export const TAB_FILTER_FIELDS: Record<Tab, readonly SearchFilterField[]> = {
	All: SEARCH_FILTER_FIELDS,
	Musics: SEARCH_FILTER_FIELDS,
	Albums: ["artist", "album", "dateAfter", "dateBefore"],
	Artists: ["artist"],
	Playlists: [],
	Users: [],
	Providers: [],
};

export function pickFilters(filters: SearchFilters, fields: readonly SearchFilterField[]): SearchFilters {
	return Object.fromEntries(fields.flatMap((field) => filters[field] === undefined ? [] : [[field, filters[field]]]));
}

export function useSearchFilters() {
	const [params, setParams] = useSearchParams();

	const filters = createMemo(() => {
		const result: SearchFilters = {};
		for (const field of SEARCH_FILTER_FIELDS) {
			const value = params[field];
			if (typeof value === "string" && value.trim() !== "") result[field] = value.trim();
		}
		return result;
	});

	const setFilters = (next: SearchFilters) => {
		setParams({ ...Object.fromEntries(SEARCH_FILTER_FIELDS.map((field) => [field, next[field] || undefined])), page: undefined }, { replace: true });
	};

	return [filters, setFilters] as const;
}

export type SearchPageSortField = SearchSortField | "provider";

export const TAB_SORT_FIELDS: Record<Tab, readonly SearchPageSortField[]> = {
	All: [],
	Musics: ["name", "artist", "album", "provider", "published", "duration"],
	Albums: ["name", "artist", "provider", "published"],
	Artists: ["name", "provider"],
	Playlists: [],
	Users: [],
	Providers: [],
};

export const PAGE_SIZE = 10;
