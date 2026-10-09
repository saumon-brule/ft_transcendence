import { initContract } from "@ts-rest/core";
import { statusSchema, friendShipBodySchema, friendsSchema, requestBodySchema, friendUuidParamSchema, requesterUuidParamSchema, manageRequestBodySchema } from "./schemas/friends.schema";

const c = initContract();

export const friendsContract = c.router(
	{
		getStatus: {
			method: "GET",
			path: "/status",
			responses: { 200: statusSchema },
			query: friendShipBodySchema,
		},
		getFriends: {
			method: "GET",
			path: "/",
			responses: { 200: friendsSchema },
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
