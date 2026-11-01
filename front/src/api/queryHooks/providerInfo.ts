import { createMemo } from "solid-js";
import { createQueries, createQuery } from "@tanstack/solid-query";
import { getProviderClient } from "../providerClients";
import { Music } from "~/class/Music";

export const useProviderInfoQuery = (providerUrl: () => string, providerUuid: () => string) => {
	const provider = createMemo(() => getProviderClient(providerUrl()));
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
			},
		}),
	});
};

export type ProviderInfo = Exclude<ReturnType<typeof useProviderInfoQuery>["data"], undefined>["body"];

export const useProviderArtistQuery = (providerUrl: () => string, providerUuid: () => string, artistUUID: () => string) => {
	const provider = createMemo(() => getProviderClient(providerUrl()));
	return createQuery({
		queryKey: () => provider().keys.artist.get([artistUUID()]),
		get enabled() { return providerUrl() !== ""; },
		queryFn: async () => {
			const res = await provider().client.artist.get.query({ params: ({ uuid: artistUUID() }) });
			if (res.status !== 200) throw new Error(`Provider artist failed with status ${res.status}`);
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
			},
		}),
	});
};


export const useProviderAlbumQuery = (providerUrl: () => string, providerUuid: () => string, albumUUID: () => string) => {
	const provider = createMemo(() => getProviderClient(providerUrl()));
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
				music: {
					...response.body.music,
					musics: response.body.music.musics.map((music) => Music.fromRawObject(music, providerUrl(), providerUuid())),
				},
			},
		}),
	});
};

const providerSearchOptions = (providerUrl: string, providerUuid: string, searchTerm: string) => {
	const provider = getProviderClient(providerUrl);
	return {
		queryKey: () => provider.keys.search.search([searchTerm]),
		enabled: providerUrl !== "" && searchTerm !== "",
		queryFn: async () => {
			const res = await provider.client.search.search.query({ query: { query: searchTerm } });
			if (res.status !== 200) throw new Error(`Provider search failed with status ${res.status}`);
			return res;
		},
		select: (response: Awaited<ReturnType<typeof provider.client.search.search.query>> & { status: 200 }) => ({
			...response,
			body: {
				...response.body,
				musics: response.body.musics.map((music) => Music.fromRawObject(music, providerUrl, providerUuid)),
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
}
