import { Controller } from "@nestjs/common";
import { tsRestHandler, TsRestHandler } from "@ts-rest/nest";
import { providerContract } from "@flex/shared";
import { OwnerOnly } from "../core/auth/auth.decorators";
import { SettingService } from "./setting.service";

@Controller()
export class SettingController {
	constructor(private readonly settingService: SettingService) {}

	@TsRestHandler(providerContract.setting.get)
	@OwnerOnly()
	get() {
		return tsRestHandler(providerContract.setting.get, async () => ({
			status: 200,
			body: await this.settingService.get(),
		}));
	}

	@TsRestHandler(providerContract.setting.update)
	@OwnerOnly()
	update() {
		return tsRestHandler(providerContract.setting.update, async ({ body }) => ({
			status: 200,
			body: await this.settingService.update(body),
		}));
	}
}
