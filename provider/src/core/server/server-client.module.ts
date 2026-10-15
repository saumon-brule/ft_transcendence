import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { env } from "../env";
import { HttpServerClientService } from "./http-server-client.service";
import { MockServerClientService } from "./mock-server-client.service";
import { ServerClientService } from "./server-client.service";

@Module({
	imports: [JwtModule.register({})],
	providers: [
		{
			provide: ServerClientService,
			useClass: env.FLEX_SERVER_MOCK
				? MockServerClientService
				: HttpServerClientService,
		},
	],
	exports: [ServerClientService],
})
export class ServerClientModule {}
