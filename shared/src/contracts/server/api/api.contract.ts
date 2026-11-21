import { initContract } from "@ts-rest/core";
import { meSchema } from "../users/schemas/user.schema";
import { commonError429Schema, serverBaseError401Schema } from "../../../errors/error-schemas";

const c = initContract();

export const API_MAX_USAGE_PER_HOUR = 1200;
export const API_MAX_USAGE_PER_SECOND = 2;

export const apiContract = c.router(
	{
		me: {
			method: "GET",
			path: "/me",
			responses: { 200: meSchema },
		},
	},
	{
		pathPrefix: "/api",
		commonResponses: {
			401: serverBaseError401Schema,
			429: commonError429Schema,
		},
	},
);
