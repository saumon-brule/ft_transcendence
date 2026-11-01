import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MediaController } from "./media.controller";
import { MediaTokenService } from "./media-token.service";
import { MediaService } from "./media.service";

@Module({
	imports: [JwtModule.register({})],
	controllers: [MediaController],
	providers: [MediaTokenService, MediaService],
	exports: [MediaService],
})
export class MediaModule {}
