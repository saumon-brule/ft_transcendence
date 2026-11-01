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

let providerRefreshPromise: Promise<string | null> | null = null;

export async function doproviderRefresh(): Promise<string | null> {
	if (providerRefreshPromise) return providerRefreshPromise;

	providerRefreshPromise = client.providers.accessToken.mutation()
		.then((r) => r.status === 200
			? r.body.token
			: null)
		.finally(() => { providerRefreshPromise = null; });

	return providerRefreshPromise;
}
