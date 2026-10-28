import { Module } from "@nestjs/common";
import { MediaModule } from "../media/media.module";
import { SearchModule } from "../search/search.module";
import { MusicController } from "./music.controller";
import { MusicService } from "./music.service";

@Module({
	imports: [MediaModule, SearchModule],
	controllers: [MusicController],
	providers: [MusicService],
})
export class MusicModule {}
