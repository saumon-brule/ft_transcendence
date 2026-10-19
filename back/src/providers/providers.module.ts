import { Module } from "@nestjs/common";
import { LoggingModule } from "../core/logging/logging.module";
import { ProviderApiController } from "../providersAPI/provider-api.controller";
import { ProviderApiKeyGuard } from "../core/guards/provider-api-key.guard";
import { ProviderApiKeysService } from "../providersAPI/provider-api-keys.service";
import { ProviderSigningKeyService } from "../providersAPI/provider-signing-key.service";
import { ProvidersController } from "./providers.controller";
import { ProvidersService } from "./providers.service";

@Module({
	imports: [LoggingModule],
	controllers: [ProvidersController, ProviderApiController],
	providers: [ProvidersService, ProviderApiKeysService, ProviderApiKeyGuard, ProviderSigningKeyService],
	exports: [ProviderSigningKeyService],
})
export class ProvidersModule {}
