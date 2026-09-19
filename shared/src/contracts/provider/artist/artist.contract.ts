import { initContract } from "@ts-rest/core";
import { artistDetailedItemSchema, artistListResponseSchema } from "./schemas/artist.schema";
import { uuidParamSchema } from "../../schemas/common.schema";

const c = initContract();

export const artistContract = c.router(
	{
		artists: {
			method: "GET",
			path: "/",
			responses: { 200: artistListResponseSchema },
		},
		artist: {
			method: "GET",
			path: "/:uuid",
			pathParams: uuidParamSchema,
			responses: { 200: artistDetailedItemSchema },
		},
	},
	{ pathPrefix: "/artist" },
);
