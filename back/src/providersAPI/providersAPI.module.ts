import { Module } from "@nestjs/common";
import { LoggingModule } from "../core/logging/logging.module";
import { ProviderApiController } from "./providerAPI.controller";
import { ProviderSigningKeyService } from "./providerSigningKey.service";
import { ProviderApiKeysService } from "./providerAPIKeys.service";

@Module({
	imports: [LoggingModule],
	controllers: [ProviderApiController],
	providers: [ProviderSigningKeyService, ProviderApiKeysService],
	exports: [ProviderApiKeysService],
})
export class ProvidersApiModule { }
