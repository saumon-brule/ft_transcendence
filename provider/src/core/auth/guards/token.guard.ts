import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { TokenService } from "../token.service";
import type { AuthenticatedRequest } from "../auth.types";
import { AppUnauthorizedException } from "../../error/unauthorized";

@Injectable()
export class TokenGuard implements CanActivate {
	constructor(
		private readonly tokens: TokenService,
	) {}

	async canActivate(context: ExecutionContext) {
		const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
		const header = request.headers.authorization;

		if (!header?.startsWith("Bearer ")) {
			throw new AppUnauthorizedException("UNAUTHORIZED", "Missing bearer token");
		}

		const auth = await this.tokens.verifyAccess(header.slice(7));

		if (auth.scope !== "access") {
			throw new AppUnauthorizedException("INVALID_TOKEN", "This token cannot be used here");
		}

		request.auth = auth;
		return true;
	}
}
