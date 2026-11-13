import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SocketAuthService } from "./auth-socket.service";
import { AuthController } from "./auth.controller";
import { UsersModule } from "../users/users.module";
import { SessionsModule } from "../sessions/sessions.module";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { RefreshStrategy } from "./strategies/refresh.strategy";
import { MailModule } from "../core/mail/mail.module";
import { TokensModule } from "../tokens/tokens.module";
import { AppConfigModule } from "../config/config.module";
import { LoggingModule } from "../core/logging/logging.module";

@Module({
	imports: [UsersModule, SessionsModule, JwtModule, MailModule, TokensModule, AppConfigModule, LoggingModule],
	providers: [AuthService, JwtStrategy, RefreshStrategy, SocketAuthService],
	controllers: [AuthController],
	exports: [AuthService, SocketAuthService],
})
export class AuthModule {}
