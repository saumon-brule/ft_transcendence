import { initContract } from "@ts-rest/core";
import { createdProviderSchema, createProviderSchema, editProviderSchema, providerSchema, regenerateKeyProviderSchema } from "./schemas/provider.schema";
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
	},
	{ pathPrefix: "/providers" },
);
