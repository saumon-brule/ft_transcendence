import { initContract } from "@ts-rest/core";
import {
	meSchema,
	searchUsersQuerySchema,
	shortUserSchema,
	updateMeSchema,
	userSchema,
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
	},
	{ pathPrefix: "/users" },
);
