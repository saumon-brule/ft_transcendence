import { initContract } from "@ts-rest/core";
import {
	providerApiKeyHeadersSchema,
	providerIdentitySchema,
	providerPublicKeySchema,
} from "./schemas/providers.schema";

const c = initContract();

export const providersContract = c.router(
	{
		provider: {
			method: "GET",
			path: "/me",
			headers: providerApiKeyHeadersSchema,
			responses: { 200: providerIdentitySchema },
		},
		publicKey: {
			method: "GET",
			path: "/public-key",
			headers: providerApiKeyHeadersSchema,
			responses: { 200: providerPublicKeySchema },
		},
	},
	{ pathPrefix: "/providers" },
);
