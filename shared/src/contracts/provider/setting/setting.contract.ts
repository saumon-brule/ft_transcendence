import { initContract } from "@ts-rest/core";
import { providerSettingSchema, updateProviderSettingSchema } from "./schemas/setting.schema";
import { commonError404Schema } from "../../../errors/error-schemas";

const c = initContract();

export const settingContract = c.router(
	{
		get: {
			method: "GET",
			path: "/",
			responses: { 200: providerSettingSchema },
		},
		update: {
			method: "PATCH",
			path: "/",
			body: updateProviderSettingSchema,
			responses: {
				200: providerSettingSchema,
				404: commonError404Schema,
			},
		},
	},
	{ pathPrefix: "/setting" },
);
