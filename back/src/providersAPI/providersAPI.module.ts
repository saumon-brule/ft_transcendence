import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { LoggingModule } from "../core/logging/logging.module";
import { ProviderApiController } from "./providerAPI.controller";
import { ProviderSigningKeyService } from "./providerSigningKey.service";
import { ProviderApiKeysService } from "./providerAPIKeys.service";

@Module({
	imports: [LoggingModule, JwtModule],
	controllers: [ProviderApiController],
	providers: [ProviderSigningKeyService, ProviderApiKeysService],
	exports: [ProviderApiKeysService, ProviderSigningKeyService],
})
export class ProvidersApiModule { }
