import { Module } from "@nestjs/common";
import { LoggingModule } from "../core/logging/logging.module";
import { ProviderApiController } from "./providerAPI.controller";
import { ProviderSigningKeyService } from "./providerSigningKey.service";
import { ProviderApiKeysService } from "./providerAPIKeys.service";
import { ProviderApiKeyGuard } from "../core/guards/provider-api-key.guard";

@Module({
	imports: [LoggingModule],
	controllers: [ProviderApiController, ProviderApiKeysService, ProviderApiKeyGuard, ProviderSigningKeyService],
	providers: [ProviderSigningKeyService],
})
export class ProvidersApiModule { }
