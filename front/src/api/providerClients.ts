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

	console.log(accessToken);

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
});

type ProviderClient = ReturnType<typeof createProviderClient>;

const providerClientsMap = new Map<string, ProviderClient>();

export const getProviderClient = (providerUrl: string): ProviderClient => {
	let providerClient = providerClientsMap.get(providerUrl);
	if (!providerClient) {
		providerClient = createProviderClient(providerUrl);
		providerClientsMap.set(providerUrl, providerClient);
	}
	return providerClient;
};

export const removeProviderClient = (providerUrl: string) => {
	providerClientsMap.delete(providerUrl);
};

