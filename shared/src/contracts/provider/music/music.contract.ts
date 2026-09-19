import { initContract } from "@ts-rest/core";
import { musicItemSchema, musicListResponseSchema } from "./schemas/music.schema";
import { uuidParamSchema } from "../../schemas/common.schema";

const c = initContract();

export const musicContract = c.router(
	{
		musics: {
			method: "GET",
			path: "/",
			responses: { 200: musicListResponseSchema },
		},
		music: {
			method: "GET",
			path: "/:uuid",
			pathParams: uuidParamSchema,
			responses: { 200: musicItemSchema },
		},
	},
	{ pathPrefix: "/music" },
);
