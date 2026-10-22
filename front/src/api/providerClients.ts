import { initQueryClient } from "@ts-rest/solid-query";
import { providerContract } from "@flex/shared";
import { ApiFetcher, tsRestFetchApi } from "@ts-rest/core";
import { summonWarningToast } from "~/components/ui/Toaster";
import { t } from "~/i18n/context";
import { queryKeyFromContract } from "./utils/queryKeys";

const fetchWithRefresh: ApiFetcher = async (args) => {
	const response = await tsRestFetchApi(args);

	if (response.status === 429) {
		summonWarningToast(() => t("errors.rateLimit"));
	}

	return response;

	// if (response.status !== 401
	// 	|| !response.body
	// 	|| (response.body
	// 		&& (response.body as z.infer<typeof serverBaseError401Schema>).code !== "INVALID_TOKEN")
	// ) return response;

	// const accessToken = await doRefresh();

	// if (accessToken === null) {
	// 	authActions.logout();
	// 	return response;
	// }

	// authActions.login(accessToken);

	// pas encore les trucs back pour la gestion du tocken donc pour l'instant c'est du comment

	return tsRestFetchApi({
		...args,
		headers: {
			...args.headers,
			// Authorization: `Bearer ${}`,
		},
	});
};

const createProviderClient = (providerUrl: string) => ({
	client: initQueryClient(providerContract, {
		baseUrl: providerUrl,
		baseHeaders: {
			Authorization: () => `Bearer ${"Le futur super token"}`,
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

