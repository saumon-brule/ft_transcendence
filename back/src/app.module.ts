import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "./core/prisma/prisma.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { SessionsModule } from "./sessions/sessions.module";
import { APP_GUARD } from "@nestjs/core";
import { PermissionGuard } from "./core/guards/permission.guard";
import { RolesModule } from "./roles/roles.module";
import { PermissionsModule } from "./permissions/permissions.module";
import { MailModule } from "./core/mail/mail.module";
import { TokensService } from "./tokens/tokens.service";
import { TokensModule } from "./tokens/tokens.module";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { LoggingModule } from "./core/logging/logging.module";
import { AppConfigModule } from "./config/config.module";
import { PlaylistsModule } from "./playlists/playlists.module";
import { FriendsModule } from "./users/friends/friends.module";

@Module({
	providers: [
		{
			provide: APP_GUARD,
			useClass: PermissionGuard,
		},
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
		TokensService,
	],
	imports: [
		PrismaModule,
		UsersModule,
		FriendsModule,
		AuthModule,
		RolesModule,
		SessionsModule,
		PermissionsModule,
		MailModule,
		LoggingModule,
		ScheduleModule.forRoot(),
		TokensModule,
		AppConfigModule,
		PlaylistsModule,
		ThrottlerModule.forRoot({
			throttlers: [{ ttl: 60000, limit: 100 }],
		}),
	],
})
export class AppModule { }
