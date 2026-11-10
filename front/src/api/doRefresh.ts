import { authContract } from "@flex/shared";
import { initClient } from "@ts-rest/core";
import { env } from "~/env";
import { client } from "./client";

const refreshClient = initClient(authContract, {
	baseUrl: env.VITE_API_URL,
});

let refreshPromise: Promise<string | null> | null = null;

export async function doRefresh(): Promise<string | null> {
	if (refreshPromise) return refreshPromise;

	refreshPromise = refreshClient.refresh()
		.then((r) => r.status === 200
			? r.body.accessToken
			: null)
		.finally(() => { refreshPromise = null; });

	return refreshPromise;
}

const providerRefreshPromises = new Map<string, Promise<string | null>>();

export async function doproviderRefresh(providerUuid: string): Promise<string | null> {
	const pending = providerRefreshPromises.get(providerUuid);
	if (pending) return pending;

	const promise = client.providers.accessToken.mutation({ params: { uuid: providerUuid } })
		.then((r) => r.status === 200
			? r.body.token
			: null)
		.finally(() => { providerRefreshPromises.delete(providerUuid); });

	providerRefreshPromises.set(providerUuid, promise);
	return promise;
}
