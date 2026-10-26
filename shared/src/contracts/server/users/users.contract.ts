import { initContract } from "@ts-rest/core";
import {
	addRoleUserSchema,
	DeleteRoleParamSchema,
	meSchema,
	updateMeSchema,
	userSchema,
} from "./schemas/user.schema";
import {
	rolesListDetailedResponseSchema,
	rolesListResponseSchema,
} from "../roles/schemas/role.schema";
import z from "zod";
import { uuidParamSchema } from "../../../schemas/common.schema";
import { commonError404Schema, commonError413Schema } from "../../../errors/error-schemas";

const c = initContract();

export const usersContract = c.router(
	{
		me: {
			method: "GET",
			path: "/me",
			responses: { 200: meSchema },
		},
		updateMe: {
			method: "PATCH",
			path: "/me",
			body: updateMeSchema,
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
			// responses: {
			// 	204: null,
			// },
			responses: {
				200: z.object({
					avatarPath: z.string(),
				}),
				413: commonError413Schema,
			},
		},
		getUserRoles: {
			method: "GET",
			path: "/:uuid/roles",
			pathParams: uuidParamSchema,
			responses: { 200: rolesListResponseSchema },
		},
		getUserRolesDetailed: {
			method: "GET",
			path: "/:uuid/roles/detailed",
			pathParams: uuidParamSchema,
			responses: { 200: rolesListDetailedResponseSchema },
		},
		addUserRole: {
			method: "POST",
			path: "/:uuid/roles",
			pathParams: uuidParamSchema,
			body: addRoleUserSchema,
			responses: {
				204: null,
				404: commonError404Schema,
			},
		},
		removeUserRole: {
			method: "DELETE",
			path: "/:uuid/roles/:roleId",
			pathParams: DeleteRoleParamSchema,
			responses: { 204: null },
		},
	},
	{ pathPrefix: "/users" },
);
