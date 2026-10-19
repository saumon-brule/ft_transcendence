import { Controller, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { tsRestHandler, TsRestHandler } from "@ts-rest/nest";
import { serverContract } from "@flex/shared";
import { type AuthUser, CurrentUser } from "../core/decorators/current-user.decorator";
import { JwtAuthGuard } from "../core/guards/jwt-auth.guard";
import { ProvidersService } from "./providers.service";

@Controller()
export class ProvidersController {
	constructor(private readonly providersService: ProvidersService) {}

	@Throttle({ default: { limit: 10, ttl: 60000 } })
	@UseGuards(JwtAuthGuard)
	@TsRestHandler(serverContract.providers.create)
	public create(@CurrentUser() user: AuthUser) {
		return tsRestHandler(serverContract.providers.create, async ({ body }) => {
			const provider = await this.providersService.create(user.uuid, body);
			return { status: 201, body: provider };
		});
	}
}
