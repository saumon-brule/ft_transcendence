import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../core/prisma/prisma.service";
import { TooManyRequestsException } from "../core/error/to-many-request";
import { AppUnauthorizedException } from "../core/error/unauthorized";
import { hashUserApiKey } from "./user-api-key";

const MAX_USAGE_PER_HOUR = 1200;
const MAX_USAGE_PER_SECOND = 2;

@Injectable()
export class PublicApiKeysService {
	private readonly recentRequests = new Map<string, number[]>();

	constructor(private readonly prisma: PrismaService) {}

	async verify(apiKey: string) {
		const user = await this.prisma.user.findUnique({
			where: { apiKeyHash: hashUserApiKey(apiKey) },
			select: { uuid: true, apiOneHourUsage: true },
		});

		if (!user) throw new AppUnauthorizedException("INVALID_TOKEN", "Invalid api key");

		if (user.apiOneHourUsage >= MAX_USAGE_PER_HOUR) throw new TooManyRequestsException("RATE_LIMITED", "Hourly api limit reached");

		const now = Date.now();
		const timestamps = (this.recentRequests.get(user.uuid) ?? []).filter((t) => now - t < 1000);
		if (timestamps.length >= MAX_USAGE_PER_SECOND) {
			this.recentRequests.set(user.uuid, timestamps);
			throw new TooManyRequestsException("RATE_LIMITED", "Too many requests per second");
		}
		timestamps.push(now);
		this.recentRequests.set(user.uuid, timestamps);

		await this.prisma.user.update({
			where: { uuid: user.uuid },
			data: { apiUsage: { increment: 1 }, apiOneHourUsage: { increment: 1 } },
		});
		return user.uuid;
	}

	@Cron(CronExpression.EVERY_HOUR)
	async resetHourlyUsage() {
		await this.prisma.user.updateMany({
			where: { apiOneHourUsage: { gt: 0 } },
			data: { apiOneHourUsage: 0 },
		});

		for (const [uuid] of this.recentRequests) {
			this.recentRequests.delete(uuid);
		}
	}
}
