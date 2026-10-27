import { createMemo } from "solid-js";
import { createQuery } from "@tanstack/solid-query";
import { getProviderClient } from "../providerClients";

export const useProviderInfoQuery = (providerUrl: () => string) => {
	const provider = createMemo(() => getProviderClient(providerUrl()));
	return createQuery({
		queryKey: () => provider().keys.info.all(),
		get enabled() { return providerUrl() !== ""; },
		queryFn: async () => {
			const res = await provider().client.info.all.query();
			if (res.status !== 200) throw new Error(`Provider info failed with status ${res.status}`);
			return res;
		},
	});
};

export const useProviderArtistQuery = (providerUrl: () => string, artistUUID: () => string) => {
	const provider = createMemo(() => getProviderClient(providerUrl()));
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
