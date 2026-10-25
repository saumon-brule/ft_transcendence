import { Module } from "@nestjs/common";
import { LoggingModule } from "../core/logging/logging.module";
import { ProvidersApiModule } from "../providersAPI/providersAPI.module";
import { ProvidersController } from "./providers.controller";
import { ProvidersService } from "./providers.service";

@Module({
	imports: [LoggingModule, ProvidersApiModule],
	controllers: [ProvidersController],
	providers: [ProvidersService],
	exports: [],
})
export class ProvidersModule {}
