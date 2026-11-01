import { createResource } from "solid-js";
import { initQueryClient } from "@ts-rest/solid-query";
import { providerContract, providerError401Schema } from "@flex/shared";
import { ApiFetcher, tsRestFetchApi } from "@ts-rest/core";
import { summonWarningToast } from "~/components/ui/Toaster";
import { t } from "~/i18n/context";
import { queryKeyFromContract } from "./utils/queryKeys";
import { z } from "zod";
import { doproviderRefresh } from "./doRefresh";
import { providerToken, authActions } from "~/store/auth.store";

const fetchWithRefresh: ApiFetcher = async (args) => {
	const response = await tsRestFetchApi(args);

	if (response.status === 429) {
		summonWarningToast(() => t("errors.rateLimit"));
	}

	if (response.status !== 401
		|| !response.body
		|| (response.body
			&& (response.body as z.infer<typeof providerError401Schema>).code !== "INVALID_TOKEN")
	) return response;

	const accessToken = await doproviderRefresh();

	authActions.setProviderToken(accessToken);

	if (accessToken === null) {
		return response;
	}

	return tsRestFetchApi({
		...args,
		headers: {
			...args.headers,
			authorization: `Bearer ${accessToken}`,
		},
	});
};

const createProviderClient = (providerUrl: string) => ({
	client: initQueryClient(providerContract, {
		baseUrl: providerUrl,
		baseHeaders: {
			Authorization: () => `Bearer ${providerToken.token}`,
		},
		api: fetchWithRefresh,
		validateResponse: true,
	}),
	keys: queryKeyFromContract(providerContract, ["provider", providerUrl]),
	mediaToken: { token: "", expiresAt: new Date(0) },
});

type ProviderClient = ReturnType<typeof createProviderClient>;

const providerClientsMap = new Map<string, ProviderClient>();

export function getProviderClient(providerUrl: string): ProviderClient {
	let providerClient = providerClientsMap.get(providerUrl);
	if (!providerClient) {
		providerClient = createProviderClient(providerUrl);
		providerClientsMap.set(providerUrl, providerClient);
	}
	return providerClient;
}

export function removeProviderClient(providerUrl: string) {
	providerClientsMap.delete(providerUrl);
}

export function refreshProviderMediaToken(providerUrl: string) {
	const providerClient = getProviderClient(providerUrl);
	return providerClient.client.media.token.query()
		.then((r) => {
			if (r.status === 200) {
				providerClient.mediaToken = { token: r.body.token, expiresAt: r.body.expiresAt };
				return true;
			} else {
				console.error(`Failed to refresh media token for provider ${providerUrl}: ${r.status}`);
				return false;
			}
		})
		.catch((err) => {
			console.error(`Error refreshing media token for provider ${providerUrl}:`, err);
			return false;
		});
}

const MEDIA_TOKEN_MIN_VALIDITY = 30_000;
const pendingMediaTokens = new Map<string, Promise<string | null>>();

export const getMediaToken = (providerUrl: string) => {
	const providerClient = getProviderClient(providerUrl);
	const { token, expiresAt } = providerClient.mediaToken;
	if (token && expiresAt.getTime() - Date.now() > MEDIA_TOKEN_MIN_VALIDITY) {
		return Promise.resolve(token);
	}

	let pending = pendingMediaTokens.get(providerUrl);
	if (!pending) {
		pending = refreshProviderMediaToken(providerUrl)
			.then((success) => success ? providerClient.mediaToken.token : null)
			.finally(() => pendingMediaTokens.delete(providerUrl));
		pendingMediaTokens.set(providerUrl, pending);
	}
	return pending;
};

// No more refresh because it is only used when called and never called to be used later
export function useMediaToken(providerUrl: () => string) {
	const [mediaToken] = createResource(providerUrl, getMediaToken);
	return mediaToken;
}
