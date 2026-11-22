import { createResource } from "solid-js";
import { initQueryClient } from "@ts-rest/solid-query";
import { providerContract, providerError401Schema } from "@flex/shared";
import { ApiFetcher, ApiFetcherArgs, tsRestFetchApi } from "@ts-rest/core";
import { summonWarningToast } from "~/components/ui/feedback/Toaster";
import { t } from "~/i18n/context";
import { queryKeyFromContract } from "./utils/queryKeys";
import { z } from "zod";
import { doproviderRefresh } from "./doRefresh";
import { providerTokens, authActions } from "~/store/auth.store";
import { xhrFetchApi } from "./xhrUtils";
import { devWarn } from "~/utils/devLog";

type ExtraArgs = { onUploadProgress?: (ratio: number) => void };

const createFetchWithRefresh = (providerUuid: string) => async (args: ApiFetcherArgs & ExtraArgs): ReturnType<ApiFetcher> => {
	if (args.route === providerContract.info.health) return tsRestFetchApi(args);

	const doFetch = (a: ApiFetcherArgs) => (
		args.onUploadProgress
			? xhrFetchApi(a, args.onUploadProgress)
			: tsRestFetchApi(a)
	);

	let token = providerTokens[providerUuid];
	if (!token) {
		token = await doproviderRefresh(providerUuid) ?? undefined;
		authActions.setProviderToken(providerUuid, token ?? null);
	}

	const withToken = (accessToken: string | undefined) => ({
		...args,
		headers: {
			...args.headers,
			...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
		},
	});

	const response = await doFetch(withToken(token));

	if (response.status === 429) {
		summonWarningToast(() => t("errors.rateLimit"));
	}

	if (response.status !== 401
		|| !response.body
		|| (response.body as z.infer<typeof providerError401Schema>).code !== "INVALID_TOKEN"
	) return response;

	const accessToken = await doproviderRefresh(providerUuid);

	authActions.setProviderToken(providerUuid, accessToken);

	if (accessToken === null) {
		return response;
	}

	return doFetch(withToken(accessToken));
};

const createProviderClient = (providerUrl: string, providerUuid: string) => ({
	client: initQueryClient(providerContract, {
		baseUrl: providerUrl,
		api: createFetchWithRefresh(providerUuid),
		validateResponse: true,
	}),
	keys: queryKeyFromContract(providerContract, ["provider", providerUuid]),
	mediaToken: { token: "", expiresAt: new Date(0) },
});

export type ProviderClient = ReturnType<typeof createProviderClient>;

const providerClientsMap = new Map<string, ProviderClient>();

export function getProviderClient(providerUrl: string, providerUuid: string): ProviderClient {
	const key = `${providerUuid}@${providerUrl}`;
	let providerClient = providerClientsMap.get(key);
	if (!providerClient) {
		providerClient = createProviderClient(providerUrl, providerUuid);
		providerClientsMap.set(key, providerClient);
	}
	return providerClient;
}

export function removeProviderClient(providerUrl: string, providerUuid: string) {
	providerClientsMap.delete(`${providerUuid}@${providerUrl}`);
}

export function refreshProviderMediaToken(providerUrl: string, providerUuid: string) {
	const providerClient = getProviderClient(providerUrl, providerUuid);
	return providerClient.client.media.token.query()
		.then((r) => {
			if (r.status === 200) {
				providerClient.mediaToken = { token: r.body.token, expiresAt: r.body.expiresAt };
				return true;
			} else {
				devWarn(`Failed to refresh media token for provider ${providerUrl}: ${r.status}`);
				return false;
			}
		})
		.catch((err) => {
			devWarn(`Error refreshing media token for provider ${providerUrl}:`, err);
			return false;
		});
}

const MEDIA_TOKEN_MIN_VALIDITY = 30_000;
const pendingMediaTokens = new Map<string, Promise<string | null>>();

export const getMediaToken = (providerUrl: string, providerUuid: string) => {
	const providerClient = getProviderClient(providerUrl, providerUuid);
	const pendingKey = `${providerUuid}@${providerUrl}`;
	const { token, expiresAt } = providerClient.mediaToken;
	if (token && expiresAt.getTime() - Date.now() > MEDIA_TOKEN_MIN_VALIDITY) {
		return Promise.resolve(token);
	}

	let pending = pendingMediaTokens.get(pendingKey);
	if (!pending) {
		pending = refreshProviderMediaToken(providerUrl, providerUuid)
			.then((success) => success ? providerClient.mediaToken.token : null)
			.finally(() => pendingMediaTokens.delete(pendingKey));
		pendingMediaTokens.set(pendingKey, pending);
	}
	return pending;
};

// No more refresh because it is only used when called and never called to be used later
export function useMediaToken(providerUrl: () => string, providerUuid: () => string) {
	const [mediaToken] = createResource(
		() => [providerUrl(), providerUuid()] as const,
		([url, uuid]) => getMediaToken(url, uuid),
	);
	return mediaToken;
}
