import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { LoggingModule } from "../core/logging/logging.module";
import { ProviderApiController } from "./providersAPI.controller";
import { ProviderSigningKeyService } from "./providersSigningKey.service";
import { ProviderApiKeysService } from "./providersAPIKeys.service";
import { ProviderAccessRequestsService } from "./providersAccessRequests.service";

@Module({
	imports: [LoggingModule, JwtModule],
	controllers: [ProviderApiController],
	providers: [ProviderSigningKeyService, ProviderApiKeysService, ProviderAccessRequestsService],
	exports: [ProviderApiKeysService, ProviderSigningKeyService, ProviderAccessRequestsService],
})
export class ProvidersApiModule { }
