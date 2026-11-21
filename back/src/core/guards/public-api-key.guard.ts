import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { AppUnauthorizedException } from "../error/unauthorized";
import { ApiUser } from "../decorators/api-user.decorator";
import { PublicApiKeysService } from "../../publicAPI/public-api.service";

export type PublicRequest = Request & { user?: ApiUser };

@Injectable()
export class PublicApiKeyGuard implements CanActivate {
	constructor(
		private readonly apiKeys: PublicApiKeysService,
	) {}

	async canActivate(context: ExecutionContext) {
		const request = context.switchToHttp().getRequest<PublicRequest>();
		const header = request.headers.authorization;

		if (!header?.startsWith("Bearer ")) {
			throw new AppUnauthorizedException("UNAUTHORIZED", "Missing API key");
		}

		const result = await this.apiKeys.verify(header.slice("Bearer ".length));

		request.user = { uuid: result };
		return true;
	}
}
