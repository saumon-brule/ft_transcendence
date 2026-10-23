import { Module } from "@nestjs/common";
import { TsRestModule } from "@ts-rest/nest";
import { AuthModule } from "./core/auth/auth.module";
import { PrismaModule } from "./core/prisma/prisma.module";
import { AccessRequestModule } from "./access-request/access-request.module";
import { AlbumModule } from "./album/album.module";
import { ArtistModule } from "./artist/artist.module";
import { InfoModule } from "./info/info.module";
import { MemberModule } from "./member/member.module";
import { MusicModule } from "./music/music.module";
import { RoleModule } from "./role/role.module";
import { SettingModule } from "./setting/setting.module";

@Module({
	imports: [
		TsRestModule.register({ validateResponses: true }),
		PrismaModule,
		AuthModule,
		InfoModule,
		AccessRequestModule,
		MemberModule,
		RoleModule,
		SettingModule,
		MusicModule,
		ArtistModule,
		AlbumModule,
	],
})
export class AppModule {}
