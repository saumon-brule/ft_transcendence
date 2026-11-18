import { initContract } from "@ts-rest/core";
import {
	meSchema,
	searchUsersQuerySchema,
	shortUserSchema,
	updateMeSchema,
	userSchema,
	usersBatchResponseSchema,
	usersBatchSchema,
} from "./schemas/user.schema";
import z from "zod";
import { uuidParamSchema } from "../../../schemas/common.schema";
import { commonError413Schema } from "../../../errors/error-schemas";

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
		searchUsers: {
			method: "GET",
			path: "/search",
			query: searchUsersQuerySchema,
			responses: { 200: z.array(shortUserSchema) },
		},
		getUsers: {
			method: "POST",
			path: "/batch",
			body: usersBatchSchema,
			responses: { 200: usersBatchResponseSchema },
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
		deleteAvatar: {
			method: "DELETE",
			path: "/me/avatar",
			body: null,
			responses: {
				204: null,
			},
		},
	},
	{ pathPrefix: "/users" },
);
