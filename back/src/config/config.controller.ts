import { Controller } from "@nestjs/common";
import { AppConfigService } from "./config.service";
// import { tsRestHandler, TsRestHandler } from "@ts-rest/nest";
// import { appConfigContract, getAppVariables } from "@flex/shared";

@Controller()
export class AppConfigController {
	constructor(private readonly appConfigService: AppConfigService) {}

	// DEPRECATED : Si on a plus de perm on peut pas avoir de modif de config par routes

	// @TsRestHandler(appConfigContract.getVariables)
	// public getVariables() {
	// 	return tsRestHandler(appConfigContract.getVariables, async () => {
	// 		const variables = await this.appConfigService.getVariables();
	// 		return { status: 200, body: getAppVariables.parse(variables) };
	// 	});
	// }

	// @TsRestHandler(appConfigContract.editVariable)
	// public editVariable() {
	// 	return tsRestHandler(appConfigContract.editVariable, async ({ params, body }) => {
	// 		await this.appConfigService.editVariables(params.key, body.value);
	// 		return { status: 204, body: null };
	// 	});
	// }
}
