import { createMemo } from "solid-js";
import { createInfiniteQuery, createQueries, createQuery, useQueryClient } from "@tanstack/solid-query";
import { getProviderClient } from "../providerClients";
import { Music } from "~/class/Music";
import { Album } from "~/class/Album";
import { Artist } from "~/class/Artist";
import { DEFAULT_PAGINATION_LIMIT, Provider, type ProviderDataDto } from "@flex/shared";

export class ProviderError extends Error {
	constructor(public readonly code: "FORBIDDEN" | "OFFLINE", message: string) {
		super(message);
		this.name = "ProviderError";
		Object.setPrototypeOf(this, ProviderError.prototype);
	}
}

const providerRetry = (failureCount: number, error: unknown) => {
	if (error instanceof ProviderError && error.code === "FORBIDDEN") return false;
	return failureCount < 2;
};

export const useProviderInfoQuery = (providerUuid: () => string, providerInfo: () => Provider | null) => {
	const providerClient = createMemo(() => getProviderClient(providerInfo()?.address ?? "", providerUuid()));
	return createQuery({
		queryKey: () => providerClient().keys.info.all(),
		get enabled() { return providerInfo() !== null; },
		retry: providerRetry,
		queryFn: async () => {
			const res = await providerClient().client.info.all.query();
			if (res.status === 403) throw new ProviderError("FORBIDDEN", `Provider info failed with status ${res.status} (invalid API key)`);
			if (res.status !== 200) throw new ProviderError("OFFLINE", `Provider info failed with status ${res.status}`);
			return res;
		},
		select: (response) => ({
			...response,
			body: {
				...response.body,
				music: {
					...response.body.music,
					musics: response.body.music.musics.map((music) => Music.fromRawObject(music, providerInfo() ?? { uuid: providerUuid(), address: "", name: "" })),
				},
				artist: {
					...response.body.artist,
					artists: response.body.artist.artists.map((artist) => Artist.fromRawObject(artist, providerInfo()?.address ?? "", providerUuid())),
				},
				album: {
					...response.body.album,
					albums: response.body.album.albums.map((album) => Album.fromRawObject(album, providerInfo()?.address ?? "", providerUuid())),
				},
			},
		}),
	});
};

export type ProviderInfo = Exclude<ReturnType<typeof useProviderInfoQuery>["data"], undefined>["body"];

export type MusicRelationFilter = { artistUuid?: string; albumUuid?: string };
export type AlbumRelationFilter = { artistUuid?: string };

export const useProviderMusicsInfiniteQuery = (providerUuid: () => string, providerInfo: () => Provider | null, search: () => string = () => "", filter: () => MusicRelationFilter = () => ({})) => {
	const providerClient = createMemo(() => getProviderClient(providerInfo()?.address ?? "", providerUuid()));
	const queryClient = useQueryClient();

	return createInfiniteQuery({
		queryKey: () => providerClient().keys.music.list([search(), JSON.stringify(filter())]),
		get enabled() { return providerInfo() !== null; },
		queryFn: async ({ pageParam }) => {
			const res = await providerClient().client.music.list.query({
				query: { offset: (pageParam as number | undefined) ?? 0, limit: DEFAULT_PAGINATION_LIMIT, search: search() || undefined, ...filter() },
			});
			if (res.status === 403) throw new ProviderError("FORBIDDEN", `Provider musics failed with status ${res.status}`);
			if (res.status !== 200) throw new ProviderError("OFFLINE", `Provider musics failed with status ${res.status}`);
			return res.body;
		},
		getNextPageParam: (lastPage, pages) => {
			const loaded = pages.reduce((n, p) => n + p.musics.length, 0);
			return loaded < lastPage.total ? loaded : undefined;
		},
		initialData: () => {
			if (search() || Object.keys(filter()).length > 0) return undefined;
			const all = queryClient.getQueryData<{ status: 200; body: ProviderDataDto }>(providerClient().keys.info.all());
			return all ? { pages: [all.body.music], pageParams: [0] } : undefined;
		},
		initialDataUpdatedAt: () => queryClient.getQueryState(providerClient().keys.info.all())?.dataUpdatedAt,
		staleTime: 30_000,
		keepPreviousData: true,
		select: (data) => ({
			...data,
			pages: data.pages.map((page) => ({
				...page,
				musics: page.musics.map((music) => Music.fromRawObject(music, providerInfo() ?? { uuid: providerUuid(), address: "", name: "" })),
			})),
		}),
	});
};

export const useProviderAlbumsInfiniteQuery = (providerUrl: () => string, providerUuid: () => string, search: () => string = () => "", filter: () => AlbumRelationFilter = () => ({})) => {
	const provider = createMemo(() => getProviderClient(providerUrl(), providerUuid()));
	const queryClient = useQueryClient();

	return createInfiniteQuery({
		queryKey: () => provider().keys.album.list([search(), JSON.stringify(filter())]),
		get enabled() { return providerUrl() !== ""; },
		queryFn: async ({ pageParam }) => {
			const res = await provider().client.album.list.query({
				query: { offset: (pageParam as number | undefined) ?? 0, limit: DEFAULT_PAGINATION_LIMIT, search: search() || undefined, ...filter() },
			});
			if (res.status === 403) throw new ProviderError("FORBIDDEN", `Provider albums failed with status ${res.status}`);
			if (res.status !== 200) throw new ProviderError("OFFLINE", `Provider albums failed with status ${res.status}`);
			return res.body;
		},
		getNextPageParam: (lastPage, pages) => {
			const loaded = pages.reduce((n, p) => n + p.albums.length, 0);
			return loaded < lastPage.total ? loaded : undefined;
		},
		initialData: () => {
			if (search() || Object.keys(filter()).length > 0) return undefined;
			const all = queryClient.getQueryData<{ status: 200; body: ProviderDataDto }>(provider().keys.info.all());
			return all ? { pages: [all.body.album], pageParams: [0] } : undefined;
		},
		initialDataUpdatedAt: () => queryClient.getQueryState(provider().keys.info.all())?.dataUpdatedAt,
		staleTime: 30_000,
		keepPreviousData: true,
		select: (data) => ({
			...data,
			pages: data.pages.map((page) => ({
				...page,
				albums: page.albums.map((album) => Album.fromRawObject(album, providerUrl(), providerUuid())),
			})),
		}),
	});
};

export const useProviderArtistsInfiniteQuery = (providerUrl: () => string, providerUuid: () => string, search: () => string = () => "") => {
	const provider = createMemo(() => getProviderClient(providerUrl(), providerUuid()));
	const queryClient = useQueryClient();

	return createInfiniteQuery({
		queryKey: () => provider().keys.artist.list([search()]),
		get enabled() { return providerUrl() !== ""; },
		queryFn: async ({ pageParam }) => {
			const res = await provider().client.artist.list.query({
				query: { offset: (pageParam as number | undefined) ?? 0, limit: DEFAULT_PAGINATION_LIMIT, search: search() || undefined },
			});
			if (res.status === 403) throw new ProviderError("FORBIDDEN", `Provider artists failed with status ${res.status}`);
			if (res.status !== 200) throw new ProviderError("OFFLINE", `Provider artists failed with status ${res.status}`);
			return res.body;
		},
		getNextPageParam: (lastPage, pages) => {
			const loaded = pages.reduce((n, p) => n + p.artists.length, 0);
			return loaded < lastPage.total ? loaded : undefined;
		},
		initialData: () => {
			if (search()) return undefined;
			const all = queryClient.getQueryData<{ status: 200; body: ProviderDataDto }>(provider().keys.info.all());
			return all ? { pages: [all.body.artist], pageParams: [0] } : undefined;
		},
		initialDataUpdatedAt: () => queryClient.getQueryState(provider().keys.info.all())?.dataUpdatedAt,
		staleTime: 30_000,
		keepPreviousData: true,
		select: (data) => ({
			...data,
			pages: data.pages.map((page) => ({
				...page,
				artists: page.artists.map((artist) => Artist.fromRawObject(artist, providerUrl(), providerUuid())),
			})),
		}),
	});
};


export const useProviderArtistQuery = (providerUrl: () => string, providerUuid: () => string, artistUUID: () => string) => {
	const provider = createMemo(() => getProviderClient(providerUrl(), providerUuid()));
	return createQuery({
		queryKey: () => provider().keys.artist.get([artistUUID()]),
		get enabled() { return providerUrl() !== ""; },
		queryFn: async () => {
			const res = await provider().client.artist.get.query({ params: ({ uuid: artistUUID() }) });
			if (res.status === 403) throw new ProviderError("FORBIDDEN", `Provider artist failed with status ${res.status}`);
			if (res.status !== 200) throw new ProviderError("OFFLINE", `Provider artist failed with status ${res.status}`);
			return res;
		},
	});
};

export type ProviderArtistQueryBody = Exclude<ReturnType<typeof useProviderArtistQuery>["data"], undefined>["body"];

export const useProviderAlbumQuery = (providerUrl: () => string, providerUuid: () => string, albumUUID: () => string) => {
	const provider = createMemo(() => getProviderClient(providerUrl(), providerUuid()));
	return createQuery({
		queryKey: () => provider().keys.album.get([albumUUID()]),
		get enabled() { return providerUrl() !== ""; },
		queryFn: async () => {
			const res = await provider().client.album.get.query({ params: ({ uuid: albumUUID() }) });
			if (res.status === 403) throw new ProviderError("FORBIDDEN", `Provider album failed with status ${res.status}`);
			if (res.status !== 200) throw new ProviderError("OFFLINE", `Provider album failed with status ${res.status}`);
			return res;
		},
		select: (response) => ({
			...response,
			body: {
				...response.body,
				artists: response.body.artists.map((artist) => Artist.fromRawObject(artist, providerUrl(), providerUuid())),
			},
		}),
	});
};

export type ProviderAlbumQueryBody = Exclude<ReturnType<typeof useProviderAlbumQuery>["data"], undefined>["body"];

/** Exact-match filters of the provider `search` route (dates are `YYYY-MM-DD`). */
export type SearchFilters = {
	music?: string;
	artist?: string;
	album?: string;
	dateAfter?: string;
	dateBefore?: string;
};

const providerSearchOptions = (providerInfo: Provider, searchTerm: string, filters: SearchFilters) => {
	const providerClient = getProviderClient(providerInfo.address, providerInfo.uuid);
	const { dateAfter, dateBefore, ...textFilters } = filters;
	const query = {
		query: searchTerm || undefined,
		...textFilters,
		dateAfter: dateAfter ? new Date(dateAfter) : undefined,
		dateBefore: dateBefore ? new Date(dateBefore) : undefined,
	};
	return {
		queryKey: () => providerClient.keys.search.search([searchTerm, JSON.stringify(filters)]),
		enabled: providerInfo.address !== "",
		queryFn: async () => {
			const res = await providerClient.client.search.search.query({ query });
			if (res.status !== 200) throw new Error(`Provider search failed with status ${res.status}`);
			return res;
		},
		keepPreviousData: true,
		select: (response: Awaited<ReturnType<typeof providerClient.client.search.search.query>> & { status: 200 }) => ({
			...response,
			body: {
				...response.body,
				musics: response.body.musics.map((music) => Music.fromRawObject(music, providerInfo)),
				artists: response.body.artists.map((artist) => Artist.fromRawObject(artist, providerInfo.address, providerInfo.uuid)),
				albums: response.body.albums.map((album) => Album.fromRawObject(album, providerInfo.address, providerInfo.uuid)),
			},
		}),
	};
};

export const useProvidersSearchQueries = (providersInfos: () => Provider[], searchTerm: () => string, filters: () => SearchFilters = () => ({})) => {
	return createQueries({
		get queries() {
			return providersInfos().map((provider) => providerSearchOptions(provider, searchTerm(), filters()));
		},
	});
};

export const everyMusicQuery = async (providerInfo: Provider, artistUuid?: string, albumUuid?: string) => {
	const providerClient = getProviderClient(providerInfo.address, providerInfo.uuid);

	const res = await providerClient.client.music.list.query(
		{ query: { artistUuid, albumUuid, offset: 0, limit: 10000 } },
	);

	if (res.status === 200) {
		return res.body.musics.map((music) => Music.fromRawObject(music, providerInfo));
	}
	return [];
};

export type MemberListFilter = { revoked?: boolean };

export const useProviderMembersQuery = (providerData: Provider, filter: () => MemberListFilter = () => ({})) => {
	const provider = getProviderClient(providerData.address, providerData.uuid);

	return provider.client.member.list.createQuery(
		() => provider.keys.member.list([JSON.stringify(filter())]),
		{
			query: {
				get revoked() {
					const { revoked } = filter();
					return revoked === undefined ? undefined : revoked ? "true" as const : "false" as const;
				},
			},
		},
		{ staleTime: 30_000 },
	);
};

export const useProviderPendingMembersQuery = (providerData: Provider) => {
	const provider = getProviderClient(providerData.address, providerData.uuid);

	return provider.client.accessRequest.list.createQuery(
		() => provider.keys.accessRequest.list(), {}, { staleTime: 30_000 },
	);
};
