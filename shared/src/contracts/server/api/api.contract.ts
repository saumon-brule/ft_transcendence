import { initContract } from "@ts-rest/core";
import { meSchema } from "../users/schemas/user.schema";
import { commonError429Schema, serverBaseError401Schema } from "../../../errors/error-schemas";

const c = initContract();

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
