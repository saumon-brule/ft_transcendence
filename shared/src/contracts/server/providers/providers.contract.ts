import { initContract } from "@ts-rest/core";
import { providerApiKeyHeadersSchema, providerIdentitySchema } from "./schemas/providers.schema";

const c = initContract();

export const providersContract = c.router(
	{
		provider: {
			method: "GET",
			path: "/me",
			headers: providerApiKeyHeadersSchema,
			responses: { 200: providerIdentitySchema },
		},
	},
	{ pathPrefix: "/providers" },
);
