import { initContract } from "@ts-rest/core";
import { friendsSchema, requestBodySchema, friendUuidParamSchema, requesterUuidParamSchema, manageRequestBodySchema, isFriendWithResponseSchema, isFriendWithQuerySchema } from "./schemas/friends.schema";

const c = initContract();

export const friendsContract = c.router(
	{
		getFriends: {
			method: "GET",
			path: "/",
			responses: { 200: friendsSchema },
		},
		isFriendWith: {
			method: "GET",
			path: "/relation",
			query: isFriendWithQuerySchema,
			responses: { 200: isFriendWithResponseSchema },
		},
		makeRequest: {
			method: "POST",
			path: "/requests",
			body: requestBodySchema,
			responses: { 204: null },
		},
		removeFriend: {
			method: "DELETE",
			path: "/:friendUuid",
			pathParams: friendUuidParamSchema,
			responses: { 204: null },
		},
		manageRequests: {
			method: "PATCH",
			path: "/requests/:requesterUuid",
			pathParams: requesterUuidParamSchema,
			body: manageRequestBodySchema,
			responses: { 204: null },
		},
	},
	{ pathPrefix: "/friends" },
);
