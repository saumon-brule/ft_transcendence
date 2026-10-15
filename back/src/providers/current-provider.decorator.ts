import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { ProviderRequest } from "./provider-api-key.guard";
import type { AuthenticatedProvider } from "./provider-api-keys.service";

/** Le provider authentifié par `ProviderApiKeyGuard`. */
export const CurrentProvider = createParamDecorator(
	(_data: unknown, ctx: ExecutionContext): AuthenticatedProvider => {
		const request = ctx.switchToHttp().getRequest<ProviderRequest>();
		return request.provider!;
	},
);
