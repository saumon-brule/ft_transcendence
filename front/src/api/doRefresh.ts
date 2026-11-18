import { authContract } from "@flex/shared";
import { initClient } from "@ts-rest/core";
import { env } from "~/env";
import { client } from "./client";

const refreshClient = initClient(authContract, {
	baseUrl: env.VITE_API_URL,
});

export class RefreshUnavailableError extends Error {
	constructor(public readonly status?: number) {
		super(status === undefined ? "Refresh request failed" : `Refresh request failed with status ${status}`);
		this.name = "RefreshUnavailableError";
		Object.setPrototypeOf(this, RefreshUnavailableError.prototype);
	}
}

let refreshPromise: Promise<string | null> | null = null;

export async function doRefresh(): Promise<string | null> {
	if (refreshPromise) return refreshPromise;

	refreshPromise = refreshClient.refresh()
		.catch(() => { throw new RefreshUnavailableError(); })
		.then((r) => {
			if (r.status === 200) return r.body.accessToken;
			if (r.status === 401 || r.status === 403) return null;
			throw new RefreshUnavailableError(r.status);
		})
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
