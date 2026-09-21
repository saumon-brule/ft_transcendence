import { initContract } from "@ts-rest/core";
import {
	createMusicSchema,
	musicDetailedItemSchema,
	musicListResponseSchema,
	streamUrlResponseSchema,
	updateMusicSchema,
} from "./schemas/music.schema";
import { listQuerySchema, uuidParamSchema } from "../../schemas/common.schema";
import { errorDefaultSchema } from "../../schemas/error-default";

const c = initContract();

export const musicContract = c.router(
	{
		list: {
			method: "GET",
			path: "/",
			query: listQuerySchema,
			responses: { 200: musicListResponseSchema },
		},
		get: {
			method: "GET",
			path: "/:uuid",
			pathParams: uuidParamSchema,
			responses: {
				200: musicDetailedItemSchema,
				404: errorDefaultSchema,
			},
		},
		create: {
			method: "POST",
			path: "/",
			body: createMusicSchema,
			responses: {
				201: musicDetailedItemSchema,
				404: errorDefaultSchema,
			},
		},
		update: {
			method: "PATCH",
			path: "/:uuid",
			pathParams: uuidParamSchema,
			body: updateMusicSchema,
			responses: {
				200: musicDetailedItemSchema,
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
		streamUrl: {
			method: "GET",
			path: "/:uuid/stream-url",
			pathParams: uuidParamSchema,
			responses: {
				200: streamUrlResponseSchema,
				404: errorDefaultSchema,
			},
		},
	},
	{ pathPrefix: "/music" },
);
