import { initContract } from "@ts-rest/core";
import { albumListResponseSchema } from "./schemas/album.schema";
import { uuidParamSchema } from "../../schemas/common.schema";

const c = initContract();

export const albumContract = c.router(
	{
		albums: {
			method: "GET",
			path: "/",
			responses: { 200: albumListResponseSchema },
		},
		album: {
			method: "GET",
			path: "/:uuid",
			pathParams: uuidParamSchema,
			responses: { 200: albumListResponseSchema },
		},
	},
	{ pathPrefix: "/album" },
);
