import { initContract } from "@ts-rest/core";
import { accessRequestStatusSchema, createdProviderSchema, createProviderSchema, editProviderSchema, providerSchema, providerTokenSchema, regenerateKeyProviderSchema } from "./schemas/provider.schema";
import { commonError404Schema, commonError409Schema } from "../../../errors/error-schemas";
import { uuidParamSchema } from "../../../schemas/common.schema";

const c = initContract();

export const providersContract = c.router(
	{
		create: {
			method: "POST",
			path: "/",
			body: createProviderSchema,
			responses: {
				201: createdProviderSchema,
				409: commonError409Schema,
			},
		},
		get: {
			method: "GET",
			path: "/:uuid",
			pathParams: uuidParamSchema,
			responses: {
				200: providerSchema,
				404: commonError404Schema,
			},
		},
		edit: {
			method: "PATCH",
			path: "/:uuid",
			pathParams: uuidParamSchema,
			body: editProviderSchema,
			responses: {
				200: providerSchema,
				404: commonError404Schema,
				409: commonError409Schema,
			},
		},
		delete: {
			method: "DELETE",
			path: "/:uuid",
			pathParams: uuidParamSchema,
			body: null,
			responses: {
				204: null,
				404: commonError404Schema,
			},
		},
		regenerateKey: {
			method: "POST",
			path: "/:uuid/regenerate-key",
			pathParams: uuidParamSchema,
			body: null,
			responses: {
				200: regenerateKeyProviderSchema,
				404: commonError404Schema,
			},
		},
		accessToken: {
			method: "POST",
			path: "/access-token",
			body: null,
			responses: {
				200: providerTokenSchema,
				404: commonError404Schema,
			},
		},
		requestAccess: {
			method: "POST",
			path: "/:uuid/access-request",
			pathParams: uuidParamSchema,
			body: null,
			responses: {
				200: accessRequestStatusSchema,
				404: commonError404Schema,
				409: commonError409Schema,
			},
		},
	},
	{ pathPrefix: "/providers" },
);
