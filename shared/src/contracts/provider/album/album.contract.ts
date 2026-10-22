import { initContract } from "@ts-rest/core";
import {
	albumDetailedItemSchema,
	albumListResponseSchema,
	createAlbumSchema,
	updateAlbumSchema,
} from "./schemas/album.schema";
import { listQuerySchema, uuidParamSchema } from "../../../schemas/common.schema";
import { commonError404Schema } from "../../../errors/error-schemas";

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
				404: commonError404Schema,
			},
		},
		create: {
			method: "POST",
			path: "/",
			body: createAlbumSchema,
			responses: {
				201: albumDetailedItemSchema,
				404: commonError404Schema,
			},
		},
		update: {
			method: "PATCH",
			path: "/:uuid",
			pathParams: uuidParamSchema,
			body: updateAlbumSchema,
			responses: {
				200: albumDetailedItemSchema,
				404: commonError404Schema,
			},
		},
		remove: {
			method: "DELETE",
			path: "/:uuid",
			pathParams: uuidParamSchema,
			responses: {
				204: null,
				404: commonError404Schema,
			},
		},
	},
	{ pathPrefix: "/albums" },
);
