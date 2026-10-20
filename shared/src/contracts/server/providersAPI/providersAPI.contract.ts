import { initContract } from "@ts-rest/core";
import {
	providerApiKeyHeadersSchema,
	providerIdentitySchema,
	providerPublicKeySchema,
} from "./schemas/providersAPI.schema";
import { serverBaseError401Schema } from "../../../errors/error-schemas";

const c = initContract();

export const providersAPIContract = c.router(
	{
		identity: {
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
		commonResponses: { 401: serverBaseError401Schema },
	},
);
