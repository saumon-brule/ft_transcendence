import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ServerClientModule } from "../server/server-client.module";
import { TokenService } from "./token.service";

@Global()
@Module({
	imports: [JwtModule.register({}), ServerClientModule],
	providers: [TokenService],
	exports: [TokenService],
})
export class AuthModule {}
