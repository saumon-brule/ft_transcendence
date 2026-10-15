import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { AppUnauthorizedException } from "../core/error/unauthorized";
import { LogBuilder } from "../core/logging/log-builder";
import { WinstonLoggerService } from "../core/logging/logger.service";
import { AuthenticatedProvider, ProviderApiKeysService } from "./provider-api-keys.service";

export type ProviderRequest = Request & { provider?: AuthenticatedProvider };

/** Authentifie un provider par sa clé API (`Authorization: Bearer flex_<uuid>_<secret>`). */
@Injectable()
export class ProviderApiKeyGuard implements CanActivate {
	constructor(
		private readonly apiKeys: ProviderApiKeysService,
		private readonly logger: WinstonLoggerService,
	) {}

	async canActivate(context: ExecutionContext) {
		const request = context.switchToHttp().getRequest<ProviderRequest>();
		const header = request.headers.authorization;

		if (!header?.startsWith("Bearer ")) {
			throw new AppUnauthorizedException("UNAUTHORIZED", "Missing API key");
		}

		const result = await this.apiKeys.verify(header.slice("Bearer ".length));
		if (!result.ok) {
			this.logger.warn(LogBuilder.provider.apiKeyRejected(result.reason, request.ip));
			throw new AppUnauthorizedException("INVALID_TOKEN", "Invalid API key");
		}

		request.provider = result.provider;
		return true;
	}
}
