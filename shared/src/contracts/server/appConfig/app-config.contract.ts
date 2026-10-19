import { initContract } from "@ts-rest/core";
import { AppVariableParam, editAppVariable, getAppVariables } from "./schemas/app-config.schema";
import { commonError404Schema } from "../../../errors/error-schemas";

const c = initContract();

export const appConfigContract = c.router(
	{
		getVariables: {
			method: "GET",
			path: "/",
			responses: {
				200: getAppVariables,
			},
		},
		editVariable: {
			method: "PATCH",
			path: "/:key",
			pathParams: AppVariableParam,
			body: editAppVariable,
			responses: {
				204: null,
				404: commonError404Schema,
			},
		},
	},
	{ pathPrefix: "/config" },
);
