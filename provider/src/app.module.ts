import { Module } from "@nestjs/common";
import { TsRestModule } from "@ts-rest/nest";
import { AuthModule } from "./core/auth/auth.module";
import { PrismaModule } from "./core/prisma/prisma.module";
import { AccessRequestsModule } from "./access-requests/access-requests.module";
import { AlbumsModule } from "./albums/albums.module";
import { ArtistsModule } from "./artists/artists.module";
import { InfoModule } from "./info/info.module";
import { MembersModule } from "./members/members.module";
import { MusicModule } from "./music/music.module";
import { RolesModule } from "./roles/roles.module";
import { SettingsModule } from "./settings/settings.module";

@Module({
	imports: [
		TsRestModule.register({ validateResponses: true }),
		PrismaModule,
		AuthModule,
		InfoModule,
		AccessRequestsModule,
		MembersModule,
		RolesModule,
		SettingsModule,
		MusicModule,
		ArtistsModule,
		AlbumsModule,
	],
})
export class AppModule {}
