import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ServerClientService } from "./server-client.service";

@Module({
	imports: [JwtModule.register({})],
	providers: [ServerClientService],
	exports: [ServerClientService],
})
export class ServerClientModule {}
