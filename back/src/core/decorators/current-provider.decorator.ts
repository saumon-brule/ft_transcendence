import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { ProviderRequest } from "../guards/provider-api-key.guard";
import type { AuthenticatedProvider } from "../../providersAPI/providerAPIKeys.service";

export const CurrentProvider = createParamDecorator(
	(_data: unknown, ctx: ExecutionContext): AuthenticatedProvider => {
		const request = ctx.switchToHttp().getRequest<ProviderRequest>();
		return request.provider!;
	},
);
