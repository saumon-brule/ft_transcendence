import { initContract } from "@ts-rest/core";
import {
	addRoleUserSchema,
	DeleteRoleParamSchema,
	meSchema,
	userSchema,
} from "./schemas/user.schema";
import {
	rolesListDetailedResponseSchema,
	rolesListResponseSchema,
} from "../roles/schemas/role.schema";
import { idParamSchema, uuidParamSchema } from "../schemas/common.schema";
import { errorDefaultSchema } from "../schemas/error-default";

const c = initContract();

export const usersContract = c.router(
	{
		me: {
			method: "GET",
			path: "/me",
			responses: { 200: meSchema },
		},
		getUser: {
			method: "GET",
			path: "/:uuid",
			pathParams: uuidParamSchema,
			responses: { 200: userSchema },
		},
		uploadAvatar: {
			method: "PATCH",
			path: "/me/avatar",
			contentType: "multipart/form-data",
			body: c.type<{ avatar: File }>(),
			responses: {
				204: null,
			},
		},
		getUserRoles: {
			method: "GET",
			path: "/:id/roles",
			pathParams: idParamSchema,
			responses: { 200: rolesListResponseSchema },
		},
		getUserRolesDetailed: {
			method: "GET",
			path: "/:id/roles/detailed",
			pathParams: idParamSchema,
			responses: { 200: rolesListDetailedResponseSchema },
		},
		addUserRole: {
			method: "POST",
			path: "/:id/roles",
			pathParams: idParamSchema,
			body: addRoleUserSchema,
			responses: {
				204: null,
				404: errorDefaultSchema,
			},
		},
		removeUserRole: {
			method: "DELETE",
			path: "/:id/roles/:roleId",
			pathParams: DeleteRoleParamSchema,
			responses: { 204: null },
		},
	},
	{ pathPrefix: "/users" },
);
