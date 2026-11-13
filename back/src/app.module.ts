import { ProvidersApiModule } from "./providersAPI/providersAPI.module";
import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "./core/prisma/prisma.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { SessionsModule } from "./sessions/sessions.module";
import { APP_GUARD } from "@nestjs/core";
import { MailModule } from "./core/mail/mail.module";
import { TokensService } from "./tokens/tokens.service";
import { TokensModule } from "./tokens/tokens.module";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { LoggingModule } from "./core/logging/logging.module";
import { AppConfigModule } from "./config/config.module";
import { PlaylistsModule } from "./playlists/playlists.module";
import { ProvidersModule } from "./providers/providers.module";
import { FriendsModule } from "./users/friends/friends.module";
import { HealthModule } from "./health/health.module";
import { PresenceModule } from "./users/presence/presence.module";

@Module({
	providers: [
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
		TokensService,
	],
	imports: [
		ProvidersApiModule,
		HealthModule,
		PrismaModule,
		UsersModule,
		FriendsModule,
		AuthModule,
		SessionsModule,
		MailModule,
		LoggingModule,
		ScheduleModule.forRoot(),
		TokensModule,
		AppConfigModule,
		PlaylistsModule,
		ProvidersModule,
		PresenceModule,
		ThrottlerModule.forRoot({
			throttlers: [{ ttl: 60000, limit: 100 }],
		}),
	],
})
export class AppModule { }
