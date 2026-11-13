import { Module } from "@nestjs/common";
import { PlaylistsService } from "./playlists.service";
import { PlaylistsController } from "./playlists.controller";
import { LoggingModule } from "../core/logging/logging.module";

@Module({
	imports: [LoggingModule],
	providers: [PlaylistsService],
	controllers: [PlaylistsController],
	exports: [PlaylistsService],
})
export class PlaylistsModule { }
