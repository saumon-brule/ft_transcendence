import { initContract } from "@ts-rest/core";
import {
	albumDetailedItemSchema,
	albumListResponseSchema,
	createAlbumSchema,
	updateAlbumSchema,
} from "./schemas/album.schema";
import { listQuerySchema, uuidParamSchema } from "../../schemas/common.schema";
import { errorDefaultSchema } from "../../schemas/error-default";

const c = initContract();

export const albumContract = c.router(
	{
		list: {
			method: "GET",
			path: "/",
			query: listQuerySchema,
			responses: { 200: albumListResponseSchema },
		},
		get: {
			method: "GET",
			path: "/:uuid",
			pathParams: uuidParamSchema,
			responses: {
				200: albumDetailedItemSchema,
				404: errorDefaultSchema,
			},
		},
		create: {
			method: "POST",
			path: "/",
			body: createAlbumSchema,
			responses: {
				201: albumDetailedItemSchema,
				404: errorDefaultSchema,
			},
		},
		update: {
			method: "PATCH",
			path: "/:uuid",
			pathParams: uuidParamSchema,
			body: updateAlbumSchema,
			responses: {
				200: albumDetailedItemSchema,
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
	{ pathPrefix: "/albums" },
);
