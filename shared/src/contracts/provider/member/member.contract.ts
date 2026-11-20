import { initContract } from "@ts-rest/core";
import {
	memberRoleParamSchema,
	providerMemberListQuerySchema,
	providerMemberListResponseSchema,
	providerMemberProfileSchema,
	providerMemberSchema,
	setMemberRolesSchema,
} from "./schemas/member.schema";
import { uuidParamSchema } from "../../../schemas/common.schema";
import { commonError404Schema } from "../../../errors/error-schemas";

const c = initContract();

export const providerMemberContract = c.router(
	{
		me: {
			method: "GET",
			path: "/me",
			responses: { 200: providerMemberProfileSchema },
		},
		leave: {
			method: "DELETE",
			path: "/me",
			body: null,
			responses: {
				204: null,
				404: commonError404Schema,
			},
		},
		list: {
			method: "GET",
			path: "/",
			query: providerMemberListQuerySchema,
			responses: { 200: providerMemberListResponseSchema },
		},
		revoke: {
			method: "POST",
			path: "/:uuid/revoke",
			pathParams: uuidParamSchema,
			body: null,
			responses: {
				204: null,
				404: commonError404Schema,
			},
		},
		setRoles: {
			method: "PUT",
			path: "/:uuid/roles",
			pathParams: uuidParamSchema,
			body: setMemberRolesSchema,
			responses: {
				200: providerMemberSchema,
				404: commonError404Schema,
			},
		},
		addRole: {
			method: "POST",
			path: "/:uuid/roles/:roleUuid",
			pathParams: memberRoleParamSchema,
			body: null,
			responses: {
				204: null,
				404: commonError404Schema,
			},
		},
		removeRole: {
			method: "DELETE",
			path: "/:uuid/roles/:roleUuid",
			pathParams: memberRoleParamSchema,
			body: null,
			responses: {
				204: null,
				404: commonError404Schema,
			},
		},
	},
	{ pathPrefix: "/member" },
);
