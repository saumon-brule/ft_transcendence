import { initContract } from "@ts-rest/core";
import {
	providerApiKeyHeadersSchema,
	providerIdentitySchema,
	providerPublicKeySchema,
} from "./schemas/providers.schema";
import { error401BaseSchema } from "../../schemas/error401";

const c = initContract();

export const serverProvidersContract = c.router(
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
	{
		pathPrefix: "/providers",
		commonResponses: { 401: error401BaseSchema },
	},
);
