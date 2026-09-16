import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { UUID } from "crypto";

export interface AuthUser {
	id: number;
	emailValidated: boolean;
	jti?: UUID;
}

export const CurrentUser = createParamDecorator(
	(data: unknown, ctx: ExecutionContext): AuthUser => {
		const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
		return request.user;
	},
);
