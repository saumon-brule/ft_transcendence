import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { env } from "../env";

/** Copies the 42 application credentials of the environment into the database, where the auth service reads them. */
@Injectable()
export class AppConfigBootstrapService implements OnModuleInit {
	constructor(private readonly prisma: PrismaService) {}

	public async onModuleInit(): Promise<void> {
		await this.prisma.appConfig.upsert({
			where: { key: "42api-uid" },
			update: { value: env.API42_CLIENT_UID },
			create: { key: "42api-uid", value: env.API42_CLIENT_UID },
		});

		await this.prisma.appConfig.upsert({
			where: { key: "42api-secret" },
			update: { value: env.API42_CLIENT_SECRET },
			create: { key: "42api-secret", value: env.API42_CLIENT_SECRET },
		});
	}
}
