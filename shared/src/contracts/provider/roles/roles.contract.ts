import { initContract } from "@ts-rest/core";
import {
	createProviderRoleSchema,
	providerRoleListResponseSchema,
	providerRoleSchema,
	updateProviderRoleSchema,
} from "./schemas/role.schema";
import { uuidParamSchema } from "../../../schemas/common.schema";
import { commonError404Schema, providerError409Schema } from "../../../errors/error-schemas";

const c = initContract();

export const providerRolesContract = c.router(
	{
		list: {
			method: "GET",
			path: "/",
			responses: { 200: providerRoleListResponseSchema },
		},
		create: {
			method: "POST",
			path: "/",
			body: createProviderRoleSchema,
			responses: {
				201: providerRoleSchema,
				409: providerError409Schema,
			},
		},
		update: {
			method: "PATCH",
			path: "/:uuid",
			pathParams: uuidParamSchema,
			body: updateProviderRoleSchema,
			responses: {
				200: providerRoleSchema,
				404: commonError404Schema,
				409: providerError409Schema,
			},
		},
		remove: {
			method: "DELETE",
			path: "/:uuid",
			pathParams: uuidParamSchema,
			responses: {
				204: null,
				404: commonError404Schema,
			},
		},
	},
	{ pathPrefix: "/roles" },
);
