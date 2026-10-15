import { Controller, UseGuards } from "@nestjs/common";
import { tsRestHandler, TsRestHandler } from "@ts-rest/nest";
import { serverContract } from "@flex/shared";
import { CurrentProvider } from "./current-provider.decorator";
import { ProviderApiKeyGuard } from "./provider-api-key.guard";
import type { AuthenticatedProvider } from "./provider-api-keys.service";
import { ProviderSigningKeyService } from "./provider-signing-key.service";

// Routes appelées par les providers eux-mêmes (pas par les utilisateurs) : authentifiées par clé API
@Controller()
export class ProviderApiController {
	constructor(private readonly signingKey: ProviderSigningKeyService) {}

	@UseGuards(ProviderApiKeyGuard)
	@TsRestHandler(serverContract.providers.provider)
	public identity(@CurrentProvider() provider: AuthenticatedProvider) {
		return tsRestHandler(serverContract.providers.provider, () => Promise.resolve({
			status: 200 as const,
			body: { uuid: provider.uuid, ownerUuid: provider.ownerUuid },
		}));
	}

	@UseGuards(ProviderApiKeyGuard)
	@TsRestHandler(serverContract.providers.publicKey)
	public publicKey() {
		return tsRestHandler(serverContract.providers.publicKey, () => Promise.resolve({
			status: 200 as const,
			body: { publicKey: this.signingKey.getPublicKeyPem() },
		}));
	}
}
