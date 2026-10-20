import { Controller } from "@nestjs/common";
import { tsRestHandler, TsRestHandler } from "@ts-rest/nest";
import { providerContract } from "@flex/shared";
import { OwnerOnly } from "../core/auth/auth.decorators";
import { SettingsService } from "./settings.service";

@Controller()
export class SettingsController {
	constructor(private readonly settingsService: SettingsService) {}

	@TsRestHandler(providerContract.settings.get)
	@OwnerOnly()
	get() {
		return tsRestHandler(providerContract.settings.get, async () => ({
			status: 200,
			body: await this.settingsService.get(),
		}));
	}

	@TsRestHandler(providerContract.settings.update)
	@OwnerOnly()
	update() {
		return tsRestHandler(providerContract.settings.update, async ({ body }) => ({
			status: 200,
			body: await this.settingsService.update(body),
		}));
	}
}
