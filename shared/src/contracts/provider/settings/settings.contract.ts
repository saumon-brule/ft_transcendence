import { initContract } from "@ts-rest/core";
import { providerSettingsSchema, updateProviderSettingsSchema } from "./schemas/settings.schema";
import { errorDefaultSchema } from "../../schemas/error-default";

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
				404: errorDefaultSchema,
			},
		},
	},
	{ pathPrefix: "/settings" },
);
