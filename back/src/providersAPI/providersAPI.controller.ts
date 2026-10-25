import { Controller, UseGuards } from "@nestjs/common";
import { tsRestHandler, TsRestHandler } from "@ts-rest/nest";
import { serverContract } from "@flex/shared";
import { CurrentProvider } from "../core/decorators/current-provider.decorator";
import { ProviderApiKeyGuard } from "../core/guards/provider-api-key.guard";
import type { AuthenticatedProvider } from "./providersAPIKeys.service";
import { ProviderAccessRequestsService } from "./providersAccessRequests.service";
import { ProviderSigningKeyService } from "./providersSigningKey.service";

@Controller()
export class ProviderApiController {
	constructor(
		private readonly signingKey: ProviderSigningKeyService,
		private readonly accessRequests: ProviderAccessRequestsService,
	) {}

	@UseGuards(ProviderApiKeyGuard)
	@TsRestHandler(serverContract.providersAPI.identity)
	public identity(@CurrentProvider() provider: AuthenticatedProvider) {
		return tsRestHandler(serverContract.providersAPI.identity, () => Promise.resolve({
			status: 200 as const,
			body: { uuid: provider.uuid, ownerUuid: provider.ownerUuid },
		}));
	}

	@UseGuards(ProviderApiKeyGuard)
	@TsRestHandler(serverContract.providersAPI.publicKey)
	public publicKey() {
		return tsRestHandler(serverContract.providersAPI.publicKey, () => Promise.resolve({
			status: 200 as const,
			body: { publicKey: this.signingKey.getPublicKeyPem() },
		}));
	}

	@UseGuards(ProviderApiKeyGuard)
	@TsRestHandler(serverContract.providersAPI.accessRequest)
	public accessRequest(@CurrentProvider() provider: AuthenticatedProvider) {
		return tsRestHandler(serverContract.providersAPI.accessRequest, async ({ params }) => ({
			status: 200,
			body: await this.accessRequests.find(provider.uuid, params.userUuid),
		}));
	}

	@UseGuards(ProviderApiKeyGuard)
	@TsRestHandler(serverContract.providersAPI.decideAccessRequest)
	public decideAccessRequest(@CurrentProvider() provider: AuthenticatedProvider) {
		return tsRestHandler(serverContract.providersAPI.decideAccessRequest, async ({ params, body }) => ({
			status: 200,
			body: await this.accessRequests.decide(provider.uuid, params.userUuid, body.decision),
		}));
	}
}
