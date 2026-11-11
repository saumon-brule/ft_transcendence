import { initContract } from "@ts-rest/core";
import { healthResponseSchema, healthUnavailableSchema } from "../../../schemas/common.schema";

const c = initContract();

export const healthContract = c.router({
	health: {
		method: "GET",
		path: "/health",
		responses: { 200: healthResponseSchema, 503: healthUnavailableSchema },
	},
});
