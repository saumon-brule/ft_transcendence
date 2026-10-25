import { initContract } from "@ts-rest/core";
import { mediaTokenResponseSchema } from "./schemas/media.schema";

const c = initContract();

export const mediaContract = c.router(
	{
		token: {
			method: "GET",
			path: "/token",
			responses: { 200: mediaTokenResponseSchema },
		},
	},
	{ pathPrefix: "/media" },
);
