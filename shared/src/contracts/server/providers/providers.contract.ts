import { initContract } from "@ts-rest/core";
import { createdProviderSchema, createProviderSchema } from "./schemas/provider.schema";
import { commonError409Schema } from "../../../errors/error-schemas";

const c = initContract();

export const providersContract = c.router(
	{
		create: {
			method: "POST",
			path: "/",
			body: createProviderSchema,
			responses: {
				201: createdProviderSchema,
				409: commonError409Schema,
			},
		},
	},
	{ pathPrefix: "/providers" },
);
