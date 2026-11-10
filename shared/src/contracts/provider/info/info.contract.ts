import { initContract } from "@ts-rest/core";
import { providerPublicInfoSchema, providerDataSchema } from "./schemas/info.schema";
import { healthResponseSchema, healthUnavailableSchema } from "../../../schemas/common.schema";

const c = initContract();

export const infoContract = c.router({
	info: {
		method: "GET",
		path: "/info",
		responses: { 200: providerPublicInfoSchema },
	},
	all: {
		method: "GET",
		path: "/all",
		responses: { 200: providerDataSchema },
	},
	health: {
		method: "GET",
		path: "/health",
		responses: { 200: healthResponseSchema, 503: healthUnavailableSchema },
	},
});
