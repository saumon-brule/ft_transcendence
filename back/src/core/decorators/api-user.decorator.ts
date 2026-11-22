import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface ApiUser {
	uuid: string;
}

export const ApiUser = createParamDecorator(
	(data: unknown, ctx: ExecutionContext): ApiUser => {
		const request = ctx.switchToHttp().getRequest<{ user: ApiUser }>();
		return request.user;
	},
);
