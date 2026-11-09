import { Controller } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { tsRestHandler, TsRestHandler } from "@ts-rest/nest";
import { serverContract } from "@flex/shared";
import { PrismaService } from "../core/prisma/prisma.service";

const DB_TIMEOUT_MS = 3000;

@Controller()
export class HealthController {
	constructor(private readonly prisma: PrismaService) {}

	@SkipThrottle()
	@TsRestHandler(serverContract.health.health)
	health() {
		return tsRestHandler(serverContract.health.health, async () => {
			const databaseUp = await this.pingDatabase();
			return databaseUp
				? { status: 200, body: { status: "ok" } }
				: { status: 503, body: { status: "error" } };
		});
	}

	private async pingDatabase(): Promise<boolean> {
		try {
			await Promise.race([
				this.prisma.$queryRaw`SELECT 1`,
				new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), DB_TIMEOUT_MS).unref()),
			]);
			return true;
		} catch {
			return false;
		}
	}
}
