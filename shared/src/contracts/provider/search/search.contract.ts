import { initContract } from "@ts-rest/core";
import { searchQuerySchema, searchResponseSchema } from "./schemas/search.schema";

const c = initContract();

export const searchContract = c.router(
	{
		search: {
			method: "GET",
			path: "/",
			query: searchQuerySchema,
			responses: { 200: searchResponseSchema },
		},
	},
	{ pathPrefix: "/search" },
);
