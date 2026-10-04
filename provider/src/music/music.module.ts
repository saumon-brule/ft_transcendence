import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MusicAudioService } from "./music-audio.service";
import { MusicController } from "./music.controller";
import { MusicService } from "./music.service";

@Module({
	imports: [JwtModule.register({})],
	controllers: [MusicController],
	providers: [MusicService, MusicAudioService],
})
export class MusicModule {}
