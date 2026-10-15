import { Controller, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { tsRestHandler, TsRestHandler } from "@ts-rest/nest";
import { providersContract } from "@flex/shared";
import { type AuthUser, CurrentUser } from "../core/decorators/current-user.decorator";
import { JwtAuthGuard } from "../core/guards/jwt-auth.guard";
import { ProvidersService } from "./providers.service";

// Gestion des providers par les utilisateurs (les routes appelées par les providers eux-mêmes sont dans provider-api.controller.ts)
@Controller()
export class ProvidersController {
	constructor(private readonly providersService: ProvidersService) {}

	@Throttle({ default: { limit: 10, ttl: 60000 } })
	@UseGuards(JwtAuthGuard)
	@TsRestHandler(providersContract.create)
	public create(@CurrentUser() user: AuthUser) {
		return tsRestHandler(providersContract.create, async ({ body }) => {
			const provider = await this.providersService.create(user.uuid, body);
			return { status: 201, body: provider };
		});
	}
}
