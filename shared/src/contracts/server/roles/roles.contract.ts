import { initContract } from "@ts-rest/core";
import {
	createRoleSchema,
	editRoleSchema,
	permissionListSchema,
	roleUsersResponseSchema,
	roleResponseSchema,
	rolesListDetailedResponseSchema,
	rolesListResponseSchema,
} from "./schemas/role.schema";
import { idParamSchema } from "../../../schemas/common.schema";
import { commonError404Schema, commonError409Schema } from "../../../errors/error-schemas";

const c = initContract();

export const rolesContract = c.router(
	{
		createRole: {
			method: "POST",
			path: "/",
			body: createRoleSchema,
			responses: {
				204: null,
				409: commonError409Schema,
			},
		},
		listRolesDetailed: {
			method: "GET",
			path: "/detailed",
			responses: { 200: rolesListDetailedResponseSchema },
		},
		editRole: {
			method: "PATCH",
			path: "/:id",
			pathParams: idParamSchema,
			body: editRoleSchema,
			responses: {
				204: null,
				404: commonError404Schema,
			},
		},
		deleteRole: {
			method: "DELETE",
			path: "/:id",
			pathParams: idParamSchema,
			responses: {
				204: null,
				404: commonError404Schema,
			},
		},
		getRole: {
			method: "GET",
			path: "/:id",
			pathParams: idParamSchema,
			responses: {
				200: roleResponseSchema,
				404: commonError404Schema,
			},
		},
		listRoles: {
			method: "GET",
			path: "/",
			responses: { 200: rolesListResponseSchema },
		},
		getRoleUsers: {
			method: "GET",
			path: "/:id/users",
			pathParams: idParamSchema,
			responses: { 200: roleUsersResponseSchema },
		},
		addRolePermissions: {
			method: "POST",
			path: "/:id/permissions",
			body: permissionListSchema,
			pathParams: idParamSchema,
			responses: {
				204: null,
				404: commonError404Schema,
			},
		},
		removeRolePermissions: {
			method: "DELETE",
			path: "/:id/permissions",
			body: permissionListSchema,
			pathParams: idParamSchema,
			responses: { 204: null },
		},
		setRolePermissions: {
			method: "PUT",
			path: "/:id/permissions",
			body: permissionListSchema,
			pathParams: idParamSchema,
			responses: {
				204: null,
				404: commonError404Schema,
			},
		},
	},
	{ pathPrefix: "/roles" },
);
