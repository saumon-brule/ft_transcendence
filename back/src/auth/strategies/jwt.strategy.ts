import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { JwtPayload } from "@flex/shared";
import { AuthUser } from "../../core/decorators/current-user.decorator";
import { env } from "../../core/env";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor() {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: env.JWT_SECRET,
		});
	}

	validate(payload: JwtPayload): AuthUser {
		return { id: payload.sub, emailValidated: payload.emailVerified };
	}
}
