import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { PrismaBootstrapService } from "./prisma-bootstrap.service";
import { ServerClientModule } from "../server/server-client.module";
import { AccessRequestModule } from "../../access-request/access-request.module";

@Global()
@Module({
	imports: [ServerClientModule, AccessRequestModule],
	providers: [PrismaService, PrismaBootstrapService],
	exports: [PrismaService],
})
export class PrismaModule {}
