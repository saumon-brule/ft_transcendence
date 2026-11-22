import { Module } from "@nestjs/common";
import { PublicApiKeysService } from "./public-api.service";
import { ApiUserController } from "./api-user.controller";
import { UsersModule } from "../users/users.module";
import { PlaylistsModule } from "../playlists/playlists.module";
import { ApiPlaylistController } from "./api-playlist.controller";

@Module({
	imports: [UsersModule, PlaylistsModule],
	controllers: [ApiUserController, ApiPlaylistController],
	providers: [PublicApiKeysService],
	exports: [PublicApiKeysService],
})
export class PublicApiModule { }
