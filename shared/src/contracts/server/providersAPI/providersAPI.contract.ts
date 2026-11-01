import { initContract } from "@ts-rest/core";
import {
	accessRequestStatusSchema,
	accessRequestUserParamsSchema,
	decideAccessRequestSchema,
	providerApiKeyHeadersSchema,
	providerIdentitySchema,
	providerPublicKeySchema,
} from "./schemas/providersAPI.schema";
import { commonError404Schema, commonError409Schema, serverBaseError401Schema } from "../../../errors/error-schemas";

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
		accessRequest: {
			method: "GET",
			path: "/access-request/:userUuid",
			pathParams: accessRequestUserParamsSchema,
			headers: providerApiKeyHeadersSchema,
			responses: {
				200: accessRequestStatusSchema,
				404: commonError404Schema,
			},
		},
		decideAccessRequest: {
			method: "PATCH",
			path: "/access-request/:userUuid",
			pathParams: accessRequestUserParamsSchema,
			headers: providerApiKeyHeadersSchema,
			body: decideAccessRequestSchema,
			responses: {
				200: accessRequestStatusSchema,
				404: commonError404Schema,
				409: commonError409Schema,
			},
		},
	},
	{
		pathPrefix: "/providers",
		commonResponses: { 401: serverBaseError401Schema },
	},
);
