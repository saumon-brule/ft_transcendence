import { initContract } from "@ts-rest/core";
import {
	audioUrlResponseSchema,
	createMusicSchema,
	musicDetailedItemSchema,
	musicListResponseSchema,
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
		audioUrl: {
			method: "GET",
			path: "/:uuid/audio-url",
			pathParams: uuidParamSchema,
			responses: {
				200: audioUrlResponseSchema,
				404: errorDefaultSchema,
			},
		},
		uploadAudio: {
			method: "PUT",
			path: "/:uuid/audio",
			pathParams: uuidParamSchema,
			contentType: "multipart/form-data",
			body: c.type<{ file: File }>(),
			responses: {
				204: null,
				404: errorDefaultSchema,
				413: errorDefaultSchema,
				415: errorDefaultSchema,
			},
		},
	},
	{ pathPrefix: "/music" },
);
