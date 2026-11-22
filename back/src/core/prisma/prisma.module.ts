import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { AppConfigBootstrapService } from "./app-config-bootstrap.service";

@Global()
@Module({
	providers: [PrismaService, AppConfigBootstrapService],
	exports: [PrismaService, AppConfigBootstrapService],
})
export class PrismaModule { }
