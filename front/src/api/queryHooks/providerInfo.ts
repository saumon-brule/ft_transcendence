import { createMemo } from "solid-js";
import { createInfiniteQuery, createQueries, createQuery, useQueryClient } from "@tanstack/solid-query";
import { getProviderClient } from "../providerClients";
import { summonErrorToast } from "~/components/ui/Toaster";
import { Music } from "~/class/Music";
import { Album } from "~/class/Album";
import { Artist } from "~/class/Artist";
import { type ALBUM_SORT_FIELDS, type ARTIST_SORT_FIELDS, DEFAULT_PAGINATION_LIMIT, type MUSIC_SORT_FIELDS, Provider, type ProviderDataDto, type SearchSortField, type SortOrder } from "@flex/shared";
import { t } from "~/i18n/context";

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

export const useProviderInfoQuery = (provider: () => Provider) => {
	const providerClient = createMemo(() => getProviderClient(provider().address, provider().uuid));
	return createQuery({
		queryKey: () => providerClient().keys.info.all(),
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
					musics: response.body.music.musics.map((music) => Music.fromRawObject(music, provider())),
				},
				artist: {
					...response.body.artist,
					artists: response.body.artist.artists.map((artist) => Artist.fromRawObject(artist, provider())),
				},
				album: {
					...response.body.album,
					albums: response.body.album.albums.map((album) => Album.fromRawObject(album, provider())),
				},
			},
		}),
	});
};

export type ProviderInfo = Exclude<ReturnType<typeof useProviderInfoQuery>["data"], undefined>["body"];

export type SearchSort<F extends string = SearchSortField> = { field: F; order: SortOrder };

type MusicSort = SearchSort<(typeof MUSIC_SORT_FIELDS)[number]>;
type AlbumSort = SearchSort<(typeof ALBUM_SORT_FIELDS)[number]>;
type ArtistSort = SearchSort<(typeof ARTIST_SORT_FIELDS)[number]>;

export type MusicRelationFilter = { artistUuid?: string; albumUuid?: string };
export type AlbumRelationFilter = { artistUuid?: string };

export const useProviderMusicsInfiniteQuery = (provider: () => Provider, search: () => string = () => "", filter: () => MusicRelationFilter = () => ({}), sort: () => MusicSort | undefined = () => undefined) => {
	const providerClient = createMemo(() => getProviderClient(provider().address, provider().uuid));
	const queryClient = useQueryClient();

	return createInfiniteQuery({
		queryKey: () => providerClient().keys.music.list([search(), JSON.stringify(filter()), JSON.stringify(sort() ?? null)]),
		queryFn: async ({ pageParam }) => {
			const res = await providerClient().client.music.list.query({
				query: { offset: (pageParam as number | undefined) ?? 0, limit: DEFAULT_PAGINATION_LIMIT, search: search() || undefined, ...filter(), sort: sort()?.field, order: sort()?.order },
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
			if (search() || Object.keys(filter()).length > 0 || sort()) return undefined;
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
				musics: page.musics.map((music) => Music.fromRawObject(music, provider())),
			})),
		}),
	});
};

export const useProviderAlbumsInfiniteQuery = (provider: () => Provider, search: () => string = () => "", filter: () => AlbumRelationFilter = () => ({}), sort: () => AlbumSort | undefined = () => undefined) => {
	const providerClient = createMemo(() => getProviderClient(provider().address, provider().uuid));
	const queryClient = useQueryClient();

	return createInfiniteQuery({
		queryKey: () => providerClient().keys.album.list([search(), JSON.stringify(filter()), JSON.stringify(sort() ?? null)]),
		queryFn: async ({ pageParam }) => {
			const res = await providerClient().client.album.list.query({
				query: { offset: (pageParam as number | undefined) ?? 0, limit: DEFAULT_PAGINATION_LIMIT, search: search() || undefined, ...filter(), sort: sort()?.field, order: sort()?.order },
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
			if (search() || Object.keys(filter()).length > 0 || sort()) return undefined;
			const all = queryClient.getQueryData<{ status: 200; body: ProviderDataDto }>(providerClient().keys.info.all());
			return all ? { pages: [all.body.album], pageParams: [0] } : undefined;
		},
		initialDataUpdatedAt: () => queryClient.getQueryState(providerClient().keys.info.all())?.dataUpdatedAt,
		staleTime: 30_000,
		keepPreviousData: true,
		select: (data) => ({
			...data,
			pages: data.pages.map((page) => ({
				...page,
				albums: page.albums.map((album) => Album.fromRawObject(album, provider())),
			})),
		}),
	});
};

export const useProviderArtistsInfiniteQuery = (provider: () => Provider, search: () => string = () => "", sort: () => ArtistSort | undefined = () => undefined) => {
	const providerClient = createMemo(() => getProviderClient(provider().address, provider().uuid));
	const queryClient = useQueryClient();

	return createInfiniteQuery({
		queryKey: () => providerClient().keys.artist.list([search(), JSON.stringify(sort() ?? null)]),
		queryFn: async ({ pageParam }) => {
			const res = await providerClient().client.artist.list.query({
				query: { offset: (pageParam as number | undefined) ?? 0, limit: DEFAULT_PAGINATION_LIMIT, search: search() || undefined, sort: sort()?.field, order: sort()?.order },
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
			if (search() || sort()) return undefined;
			const all = queryClient.getQueryData<{ status: 200; body: ProviderDataDto }>(providerClient().keys.info.all());
			return all ? { pages: [all.body.artist], pageParams: [0] } : undefined;
		},
		initialDataUpdatedAt: () => queryClient.getQueryState(providerClient().keys.info.all())?.dataUpdatedAt,
		staleTime: 30_000,
		keepPreviousData: true,
		select: (data) => ({
			...data,
			pages: data.pages.map((page) => ({
				...page,
				artists: page.artists.map((artist) => Artist.fromRawObject(artist, provider())),
			})),
		}),
	});
};


export const useProviderArtistQuery = (provider: () => Provider, artistUUID: () => string) => {
	const providerClient = createMemo(() => getProviderClient(provider().address, provider().uuid));
	return createQuery({
		queryKey: () => providerClient().keys.artist.get([artistUUID()]),
		queryFn: async () => {
			const res = await providerClient().client.artist.get.query({ params: ({ uuid: artistUUID() }) });
			if (res.status === 403) throw new ProviderError("FORBIDDEN", `Provider artist failed with status ${res.status}`);
			if (res.status !== 200) throw new ProviderError("OFFLINE", `Provider artist failed with status ${res.status}`);
			return res;
		},
	});
};

export type ProviderArtistQueryBody = Exclude<ReturnType<typeof useProviderArtistQuery>["data"], undefined>["body"];

export const useProviderAlbumQuery = (provider: () => Provider, albumUUID: () => string) => {
	const providerClient = createMemo(() => getProviderClient(provider().address, provider().uuid));
	return createQuery({
		queryKey: () => providerClient().keys.album.get([albumUUID()]),
		queryFn: async () => {
			const res = await providerClient().client.album.get.query({ params: ({ uuid: albumUUID() }) });
			if (res.status === 403) throw new ProviderError("FORBIDDEN", `Provider album failed with status ${res.status}`);
			if (res.status !== 200) throw new ProviderError("OFFLINE", `Provider album failed with status ${res.status}`);
			return res;
		},
		select: (response) => ({
			...response,
			body: {
				...response.body,
				artists: response.body.artists.map((artist) => Artist.fromRawObject(artist, provider())),
			},
		}),
	});
};

export type ProviderAlbumQueryBody = Exclude<ReturnType<typeof useProviderAlbumQuery>["data"], undefined>["body"];

export type SearchFilters = {
	music?: string;
	artist?: string;
	album?: string;
	dateAfter?: string;
	dateBefore?: string;
};

export type SearchOptions = {
	sort?: SearchSort;
	limit?: number;
};

const providerSearchOptions = (provider: Provider, searchTerm: string, filters: SearchFilters, options: SearchOptions) => {
	const providerClient = getProviderClient(provider.address, provider.uuid);
	const { dateAfter, dateBefore, ...textFilters } = filters;
	const query = {
		query: searchTerm || undefined,
		...textFilters,
		dateAfter: dateAfter ? new Date(dateAfter) : undefined,
		dateBefore: dateBefore ? new Date(dateBefore) : undefined,
		limit: options.limit,
		sort: options.sort?.field,
		order: options.sort?.order,
	};
	return {
		queryKey: () => providerClient.keys.search.search([searchTerm, JSON.stringify(filters), JSON.stringify(options)]),
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
				musics: response.body.musics.map((music) => Music.fromRawObject(music, provider)),
				artists: response.body.artists.map((artist) => Artist.fromRawObject(artist, provider)),
				albums: response.body.albums.map((album) => Album.fromRawObject(album, provider)),
			},
		}),
	};
};

export const useProvidersSearchQueries = (providersInfos: () => Provider[], searchTerm: () => string, filters: () => SearchFilters = () => ({}), options: () => SearchOptions = () => ({})) => {
	return createQueries({
		get queries() {
			return providersInfos().map((provider) => providerSearchOptions(provider, searchTerm(), filters(), options()));
		},
	});
};

export const everyMusicQuery = async (providerInfo: Provider, artistUuid?: string, albumUuid?: string): Promise<Music[] | null> => {
	const providerClient = getProviderClient(providerInfo.address, providerInfo.uuid);

	try {
		const res = await providerClient.client.music.list.query(
			{ query: { artistUuid, albumUuid, offset: 0, limit: 10000 } },
		);
		if (res.status === 200) {
			return res.body.musics.map((music) => Music.fromRawObject(music, providerInfo));
		}
		summonErrorToast(t("toasts.provider.loadMusicsError", { provider: providerInfo.name }));
	} catch {
		summonErrorToast(`${providerInfo.name} is unreachable`);
	}
	return null;
};
