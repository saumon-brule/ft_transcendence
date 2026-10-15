import { Module } from "@nestjs/common";
import { LoggingModule } from "../core/logging/logging.module";
import { ProviderApiController } from "./provider-api.controller";
import { ProviderApiKeyGuard } from "./provider-api-key.guard";
import { ProviderApiKeysService } from "./provider-api-keys.service";
import { ProviderSigningKeyService } from "./provider-signing-key.service";
import { ProvidersController } from "./providers.controller";
import { ProvidersService } from "./providers.service";

@Module({
	imports: [LoggingModule],
	controllers: [ProvidersController, ProviderApiController],
	providers: [ProvidersService, ProviderApiKeysService, ProviderApiKeyGuard, ProviderSigningKeyService],
	exports: [ProviderSigningKeyService],
})
export class ProvidersModule {}
