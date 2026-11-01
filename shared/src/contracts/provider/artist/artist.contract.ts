import { initContract } from "@ts-rest/core";
import {
	artistDetailedItemSchema,
	artistListResponseSchema,
	createArtistSchema,
	updateArtistSchema,
} from "./schemas/artist.schema";
import { listQuerySchema, uuidParamSchema } from "../../../schemas/common.schema";
import { commonError404Schema, commonError413Schema, commonError415Schema } from "../../../errors/error-schemas";

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
				404: commonError404Schema,
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
		uploadAvatar: {
			method: "PUT",
			path: "/:uuid/avatar",
			pathParams: uuidParamSchema,
			contentType: "multipart/form-data",
			body: c.type<{ file: File }>(),
			responses: {
				204: null,
				404: commonError404Schema,
				413: commonError413Schema,
				415: commonError415Schema,
			},
		},
		removeAvatar: {
			method: "DELETE",
			path: "/:uuid/avatar",
			pathParams: uuidParamSchema,
			responses: {
				204: null,
				404: commonError404Schema,
			},
		},
	},
	{ pathPrefix: "/artist" },
);
