import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AppUnauthorizedException } from "../error/unauthorized";
import { AuthUser } from "../decorators/current-user.decorator";

@Injectable()
export class JwtAuthRefreshGuard extends AuthGuard("jwt-refresh") {
	handleRequest<TUser = AuthUser>(
		err: Error | null,
		user: AuthUser | null,
	) {
		if (err || !user) {
			throw new AppUnauthorizedException(
				"INVALID_REFRESH_TOKEN",
				"Invalid or missing token",
			);
		}
		return user as TUser;
	}
}
