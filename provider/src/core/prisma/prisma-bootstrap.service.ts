import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/client/client";
import { env } from "../env";
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaBootstrapService implements OnModuleInit {
	constructor(private readonly prisma: PrismaService) {}

	async onModuleInit() {
		await this.prisma.permissions.upsert({
			where: { uuid: "..." },
			update: {},
			create: { uuid: "...", role: "OWNER" },
		});
	}
}
