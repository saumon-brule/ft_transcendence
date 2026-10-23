import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { ProviderTokenScope } from "@flex/shared";
import { TokenService } from "../token.service";
import { SCOPES_KEY } from "../auth.constants";
import type { AuthenticatedRequest } from "../auth.types";
import { AppUnauthorizedException } from "../../error/unauthorized";

@Injectable()
export class TokenGuard implements CanActivate {
	constructor(
		private readonly tokens: TokenService,
		private readonly reflector: Reflector,
	) {}

	async canActivate(context: ExecutionContext) {
		const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
		const header = request.headers.authorization;

		if (!header?.startsWith("Bearer ")) {
			throw new AppUnauthorizedException("UNAUTHORIZED", "Missing bearer token");
		}

		const auth = await this.tokens.verify(header.slice(7));
		const allowed = this.reflector.getAllAndOverride<ProviderTokenScope[] | undefined>(
			SCOPES_KEY,
			[context.getHandler(), context.getClass()],
		);

		const scopes = allowed?.length
			? allowed
			: ["access"];

		if (!scopes.includes(auth.scope)) {
			throw new AppUnauthorizedException("INVALID_TOKEN", "This token cannot be used here");
		}

		request.auth = auth;
		return true;
	}
}
