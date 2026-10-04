import { initContract } from "@ts-rest/core";
import {
	accessRequestListQuerySchema,
	accessRequestListResponseSchema,
	accessRequestSchema,
	decideAccessRequestSchema,
} from "./schemas/access-request.schema";
import { uuidParamSchema } from "../../schemas/common.schema";
import { errorDefaultSchema } from "../../schemas/error-default";

const c = initContract();

export const accessRequestsContract = c.router(
	{
		create: {
			method: "POST",
			path: "/",
			body: null,
			responses: {
				201: accessRequestSchema,
				409: errorDefaultSchema,
			},
		},
		me: {
			method: "GET",
			path: "/me",
			responses: {
				200: accessRequestSchema,
				404: errorDefaultSchema,
			},
		},
		list: {
			method: "GET",
			path: "/",
			query: accessRequestListQuerySchema,
			responses: { 200: accessRequestListResponseSchema },
		},
		decide: {
			method: "PATCH",
			path: "/:uuid",
			pathParams: uuidParamSchema,
			body: decideAccessRequestSchema,
			responses: {
				200: accessRequestSchema,
				404: errorDefaultSchema,
				409: errorDefaultSchema,
			},
		},
	},
	{ pathPrefix: "/access-requests" },
);
