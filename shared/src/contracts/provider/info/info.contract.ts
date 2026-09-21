import { initContract } from "@ts-rest/core";
import { healthResponseSchema, providerPublicInfoSchema } from "./schemas/info.schema";

const c = initContract();

export const infoContract = c.router({
	get: {
		method: "GET",
		path: "/info",
		responses: { 200: providerPublicInfoSchema },
	},
	health: {
		method: "GET",
		path: "/health",
		responses: { 200: healthResponseSchema },
	},
});
