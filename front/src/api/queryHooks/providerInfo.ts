import { createMemo } from "solid-js";
import { createInfiniteQuery, createQueries, createQuery, useQueryClient } from "@tanstack/solid-query";
import { getProviderClient } from "../providerClients";
import { Music } from "~/class/Music";
import { Album } from "~/class/Album";
import { Artist } from "~/class/Artist";
import { DEFAULT_PAGINATION_LIMIT, type ProviderDataDto } from "@flex/shared";

export const useProviderInfoQuery = (providerUrl: () => string, providerUuid: () => string) => {
	const provider = createMemo(() => getProviderClient(providerUrl(), providerUuid()));
	return createQuery({
		queryKey: () => provider().keys.info.all(),
		get enabled() { return providerUrl() !== ""; },
		queryFn: async () => {
			const res = await provider().client.info.all.query();
			if (res.status !== 200) throw new Error(`Provider info failed with status ${res.status}`);
			return res;
		},
		select: (response) => ({
			...response,
			body: {
				...response.body,
				music: {
					...response.body.music,
					musics: response.body.music.musics.map((music) => Music.fromRawObject(music, providerUrl(), providerUuid())),
				},
				artist: {
					...response.body.artist,
					artists: response.body.artist.artists.map((artist) => Artist.fromRawObject(artist, providerUrl(), providerUuid())),
				},
				album: {
					...response.body.album,
					albums: response.body.album.albums.map((album) => Album.fromRawObject(album, providerUrl(), providerUuid())),
				},
			},
		}),
	});
};

export type ProviderInfo = Exclude<ReturnType<typeof useProviderInfoQuery>["data"], undefined>["body"];

export type MusicRelationFilter = { artistUuid?: string; albumUuid?: string };
export type AlbumRelationFilter = { artistUuid?: string };

export const useProviderMusicsInfiniteQuery = (providerUrl: () => string, providerUuid: () => string, search: () => string = () => "", filter: () => MusicRelationFilter = () => ({})) => {
	const provider = createMemo(() => getProviderClient(providerUrl(), providerUuid()));
	const queryClient = useQueryClient();

	return createInfiniteQuery({
		queryKey: () => provider().keys.music.list([search(), JSON.stringify(filter())]),
		get enabled() { return providerUrl() !== ""; },
		queryFn: async ({ pageParam }) => {
			const res = await provider().client.music.list.query({
				query: { offset: (pageParam as number | undefined) ?? 0, limit: DEFAULT_PAGINATION_LIMIT, search: search() || undefined, ...filter() },
			});
			if (res.status !== 200) throw new Error(`Provider musics failed with status ${res.status}`);
			return res.body;
		},
		getNextPageParam: (lastPage, pages) => {
			const loaded = pages.reduce((n, p) => n + p.musics.length, 0);
			return loaded < lastPage.total ? loaded : undefined;
		},
		initialData: () => {
			if (search() || Object.keys(filter()).length > 0) return undefined;
			const all = queryClient.getQueryData<{ status: 200; body: ProviderDataDto }>(provider().keys.info.all());
			return all ? { pages: [all.body.music], pageParams: [0] } : undefined;
		},
		initialDataUpdatedAt: () => queryClient.getQueryState(provider().keys.info.all())?.dataUpdatedAt,
		staleTime: 30_000,
		keepPreviousData: true,
		select: (data) => ({
			...data,
			pages: data.pages.map((page) => ({
				...page,
				musics: page.musics.map((music) => Music.fromRawObject(music, providerUrl(), providerUuid())),
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
			if (res.status !== 200) throw new Error(`Provider albums failed with status ${res.status}`);
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
			if (res.status !== 200) throw new Error(`Provider artists failed with status ${res.status}`);
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
			if (res.status !== 200) throw new Error(`Provider artist failed with status ${res.status}`);
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
			if (res.status !== 200) throw new Error(`Provider album failed with status ${res.status}`);
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

const providerSearchOptions = (providerUrl: string, providerUuid: string, searchTerm: string) => {
	const provider = getProviderClient(providerUrl, providerUuid);
	return {
		queryKey: () => provider.keys.search.search([searchTerm]),
		enabled: providerUrl !== "" && searchTerm !== "",
		queryFn: async () => {
			const res = await provider.client.search.search.query({ query: { query: searchTerm } });
			if (res.status !== 200) throw new Error(`Provider search failed with status ${res.status}`);
			return res;
		},
		keepPreviousData: true,
		select: (response: Awaited<ReturnType<typeof provider.client.search.search.query>> & { status: 200 }) => ({
			...response,
			body: {
				...response.body,
				musics: response.body.musics.map((music) => Music.fromRawObject(music, providerUrl, providerUuid)),
				artists: response.body.artists.map((artist) => Artist.fromRawObject(artist, providerUrl, providerUuid)),
				albums: response.body.albums.map((album) => Album.fromRawObject(album, providerUrl, providerUuid)),
			},
		}),
	};
};

export const useProvidersSearchQueries = (providers: () => { address: string; uuid: string }[], searchTerm: () => string) => {
	return createQueries({
		get queries() {
			return providers().map((provider) => providerSearchOptions(provider.address, provider.uuid, searchTerm()));
		},
	});
};
