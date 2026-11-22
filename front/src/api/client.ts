import { initQueryClient } from "@ts-rest/solid-query";
import { serverContract } from "@flex/shared";
import { auth, authActions } from "../store/auth.store";
import { ApiFetcher, ApiFetcherArgs, tsRestFetchApi } from "@ts-rest/core";
import { env } from "~/env";
import { doRefresh } from "./doRefresh";
import z from "zod";
import { serverBaseError401Schema } from "@flex/shared";
import { summonWarningToast } from "~/components/ui/Toaster";
import { t } from "~/i18n/context";
import { queryKeyFromContract } from "./utils/queryKeys";
import { xhrFetchApi } from "./xhrUtils";

type ExtraArgs = { onUploadProgress?: (ratio: number) => void };

const fetchWithRefresh = async (args: ApiFetcherArgs & ExtraArgs): ReturnType<ApiFetcher> => {
	const doFetch = (a: ApiFetcherArgs) => (
		args.onUploadProgress
			? xhrFetchApi(a, args.onUploadProgress)
			: tsRestFetchApi(a)
	);

	const response = await doFetch(args);

	if (response.status === 429) {
		summonWarningToast(() => t("errors.rateLimit"));
	}

	if (response.status !== 401
		|| !response.body
		|| (response.body
			&& (response.body as z.infer<typeof serverBaseError401Schema>).code !== "INVALID_TOKEN")
	) return response;

	let accessToken: string | null;
	try {
		accessToken = await doRefresh();
	} catch {
		return response;
	}

	if (accessToken === null) {
		authActions.logout();
		return response;
	}

	authActions.login(accessToken);

	return doFetch({
		...args,
		headers: {
			...args.headers,
			authorization: `Bearer ${accessToken}`,
		},
	});
};

export const client = initQueryClient(serverContract, {
	baseUrl: env.VITE_API_URL,
	baseHeaders: {
		Authorization: () => `Bearer ${auth.accessToken}`,
	},
	api: fetchWithRefresh,
	validateResponse: true,
});

export const queryKeys = queryKeyFromContract(serverContract);
