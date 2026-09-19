import { PrismaService } from './../../../../provider/src/core/prisma/prisma.service';
import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { DatabaseBootstrapService } from "./prisma-bootstrap.service";

@Global()
@Module({
	providers: [
		PrismaService, PrismaService, DatabaseBootstrapService],
	exports: [PrismaService, DatabaseBootstrapService],
})
export class PrismaModule { }
