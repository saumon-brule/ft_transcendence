import { initContract } from "@ts-rest/core";
import {
	accessRequestDecideResponseSchema,
	accessRequestListQuerySchema,
	accessRequestListResponseSchema,
	accessRequestStatusSchema,
	decideAccessRequestSchema,
	myAccessRequestResponseSchema,
} from "./schemas/access-request.schema";
import { uuidParamSchema } from "../../../schemas/common.schema";
import { commonError404Schema, providerError409Schema } from "../../../errors/error-schemas";

const c = initContract();

export const accessRequestContract = c.router(
	{
		create: {
			method: "POST",
			path: "/",
			body: null,
			responses: {
				201: accessRequestStatusSchema,
				404: commonError404Schema,
				409: providerError409Schema,
			},
		},
		me: {
			method: "GET",
			path: "/me",
			responses: {
				200: myAccessRequestResponseSchema,
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
				200: accessRequestDecideResponseSchema,
				404: commonError404Schema,
				409: providerError409Schema,
			},
		},
	},
	{ pathPrefix: "/access-request" },
);
