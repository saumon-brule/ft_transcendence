import { initContract } from "@ts-rest/core";
import {
	createProviderRoleSchema,
	providerRoleListResponseSchema,
	providerRoleSchema,
	updateProviderRoleSchema,
} from "./schemas/role.schema";
import { uuidParamSchema } from "../../schemas/common.schema";
import { errorDefaultSchema } from "../../schemas/error-default";

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
				409: errorDefaultSchema,
			},
		},
		update: {
			method: "PATCH",
			path: "/:uuid",
			pathParams: uuidParamSchema,
			body: updateProviderRoleSchema,
			responses: {
				200: providerRoleSchema,
				404: errorDefaultSchema,
				409: errorDefaultSchema,
			},
		},
		remove: {
			method: "DELETE",
			path: "/:uuid",
			pathParams: uuidParamSchema,
			responses: {
				204: null,
				404: errorDefaultSchema,
				409: errorDefaultSchema,
			},
		},
	},
	{ pathPrefix: "/roles" },
);
