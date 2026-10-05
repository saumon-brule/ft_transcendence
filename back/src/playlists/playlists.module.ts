import { Module } from "@nestjs/common";
import { PlaylistsService } from "./playlists.service";
import { PlaylistsController } from "./playlists.controller";
import { RolesModule } from "../roles/roles.module";
import { LoggingModule } from "../core/logging/logging.module";

@Module({
	imports: [RolesModule, LoggingModule],
	providers: [PlaylistsService],
	controllers: [PlaylistsController],
	exports: [PlaylistsService],
})
export class PlaylistsModule {}
