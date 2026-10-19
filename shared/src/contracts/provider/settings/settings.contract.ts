import { initContract } from "@ts-rest/core";
import { providerSettingsSchema, updateProviderSettingsSchema } from "./schemas/settings.schema";
import { commonError404Schema } from "../../../errors/error-schemas";

const c = initContract();

export const settingsContract = c.router(
	{
		get: {
			method: "GET",
			path: "/",
			responses: { 200: providerSettingsSchema },
		},
		update: {
			method: "PATCH",
			path: "/",
			body: updateProviderSettingsSchema,
			responses: {
				200: providerSettingsSchema,
				404: commonError404Schema,
			},
		},
	},
	{ pathPrefix: "/settings" },
);
