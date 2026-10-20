import { Module } from "@nestjs/common";
import { LoggingModule } from "../core/logging/logging.module";
import { ProvidersController } from "./providers.controller";
import { ProvidersService } from "./providers.service";

@Module({
	imports: [LoggingModule],
	controllers: [ProvidersController],
	providers: [ProvidersService],
	exports: [],
})
export class ProvidersModule {}
