import { Controller } from "@nestjs/common";
import { tsRestHandler, TsRestHandler } from "@ts-rest/nest";
import { providerContract } from "@flex/shared";
import { InfoService } from "./info.service";

@Controller()
export class InfoController {
	constructor(private readonly infoService: InfoService) {}

	@TsRestHandler(providerContract.info.info)
	get() {
		return tsRestHandler(providerContract.info.info, async () => ({
			status: 200,
			body: await this.infoService.get(),
		}));
	}

	@TsRestHandler(providerContract.info.health)
	health() {
		return tsRestHandler(providerContract.info.health, async () => ({
			status: 200,
			body: { status: "ok" as const },
		}));
	}
}
