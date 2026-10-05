import { initContract } from "@ts-rest/core";
import {
	artistDetailedItemSchema,
	artistListResponseSchema,
	createArtistSchema,
	updateArtistSchema,
} from "./schemas/artist.schema";
import { listQuerySchema, uuidParamSchema } from "../../schemas/common.schema";
import { errorDefaultSchema } from "../../schemas/error-default";

const c = initContract();

export const artistContract = c.router(
	{
		list: {
			method: "GET",
			path: "/",
			query: listQuerySchema,
			responses: { 200: artistListResponseSchema },
		},
		get: {
			method: "GET",
			path: "/:uuid",
			pathParams: uuidParamSchema,
			responses: {
				200: artistDetailedItemSchema,
				404: errorDefaultSchema,
			},
		},
		create: {
			method: "POST",
			path: "/",
			body: createArtistSchema,
			responses: { 201: artistDetailedItemSchema },
		},
		update: {
			method: "PATCH",
			path: "/:uuid",
			pathParams: uuidParamSchema,
			body: updateArtistSchema,
			responses: {
				200: artistDetailedItemSchema,
				404: errorDefaultSchema,
			},
		},
		remove: {
			method: "DELETE",
			path: "/:uuid",
			pathParams: uuidParamSchema,
			responses: {
				204: null,
				404: errorDefaultSchema,
			},
		},
	},
	{ pathPrefix: "/artists" },
);
