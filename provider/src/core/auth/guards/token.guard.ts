import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { TokenService } from "../token.service";
import type { AuthenticatedRequest } from "../auth.types";
import { AppUnauthorizedException } from "../../error/unauthorized";

@Injectable()
export class TokenGuard implements CanActivate {
	constructor(private readonly tokens: TokenService) {}

	async canActivate(context: ExecutionContext) {
		const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
		const header = request.headers.authorization;

		if (!header?.startsWith("Bearer ")) {
			throw new AppUnauthorizedException("UNAUTHORIZED", "Missing bearer token");
		}

		request.auth = { userUuid: await this.tokens.verify(header.slice(7)) };
		return true;
	}
}
