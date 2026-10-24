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

	@UseGuards(JwtAuthGuard)
	@TsRestHandler(serverContract.providers.edit)
	public edit(@CurrentUser() user: AuthUser) {
		return tsRestHandler(serverContract.providers.edit, async ({ params, body }) => {
			const provider = await this.providersService.edit(user.uuid, params.uuid, body);
			return { status: 200, body: provider };
		});
	}

	@UseGuards(JwtAuthGuard)
	@TsRestHandler(serverContract.providers.delete)
	public delete(@CurrentUser() user: AuthUser) {
		return tsRestHandler(serverContract.providers.delete, async ({ params }) => {
			await this.providersService.delete(user.uuid, params.uuid);
			return { status: 204, body: null };
		});
	}

	@UseGuards(JwtAuthGuard)
	@TsRestHandler(serverContract.providers.regenerateKey)
	public regenerateKey(@CurrentUser() user: AuthUser) {
		return tsRestHandler(serverContract.providers.regenerateKey, async ({ params }) => {
			const provider = await this.providersService.regenerateKey(user.uuid, params.uuid);
			return { status: 200, body: provider };
		});
	}

	@Throttle({ default: { limit: 30, ttl: 60000 } })
	@UseGuards(JwtAuthGuard)
	@TsRestHandler(serverContract.providers.accessToken)
	public accessToken(@CurrentUser() user: AuthUser) {
		return tsRestHandler(serverContract.providers.accessToken, async () => {
			const token = await this.providersService.issueAccessToken(user.uuid);
			return { status: 200, body: token };
		});
	}

	@Throttle({ default: { limit: 30, ttl: 60000 } })
	@UseGuards(JwtAuthGuard)
	@TsRestHandler(serverContract.providers.requestAccessToken)
	public requestAccessToken(@CurrentUser() user: AuthUser) {
		return tsRestHandler(serverContract.providers.requestAccessToken, async ({ params }) => {
			const token = await this.providersService.issueRequestAccessToken(user.uuid, params.uuid);
			return { status: 200, body: token };
		});
	}
}
