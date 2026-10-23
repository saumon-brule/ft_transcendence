import { Module } from "@nestjs/common";
import { MediaModule } from "../media/media.module";
import { MusicController } from "./music.controller";
import { MusicService } from "./music.service";

@Module({
	imports: [MediaModule],
	controllers: [MusicController],
	providers: [MusicService],
})
export class MusicModule {}
