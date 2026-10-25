import { Controller } from "@nestjs/common";
import { tsRestHandler, TsRestHandler } from "@ts-rest/nest";
import { providerContract } from "@flex/shared";
import { InfoService } from "./info.service";
import { Authenticated, MemberOnly } from "../core/auth/auth.decorators";

@Controller()
export class InfoController {
	constructor(private readonly infoService: InfoService) {}

	@TsRestHandler(providerContract.info.info)
	@Authenticated()
	get() {
		return tsRestHandler(providerContract.info.info, async () => ({
			status: 200,
			body: await this.infoService.get(),
		}));
	}

	@TsRestHandler(providerContract.info.all)
	@MemberOnly()
	all() {
		return tsRestHandler(providerContract.info.all, async () => ({
			status: 200,
			body: await this.infoService.all(),
		}));
	}

	@TsRestHandler(providerContract.info.health)
	@Authenticated()
	health() {
		return tsRestHandler(providerContract.info.health, () => Promise.resolve({
			status: 200,
			body: { status: "ok" },
		}));
	}
}
