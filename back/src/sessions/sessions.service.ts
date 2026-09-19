import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../core/prisma/prisma.service";
import { UUID } from "crypto";
import { WinstonLoggerService } from "../core/logging/logger.service";
import { LogBuilder } from "../core/logging/log-builder";

@Injectable()
export class SessionsService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly logger: WinstonLoggerService,
	) {}

	private readonly nestLogger = new Logger(SessionsService.name);

	@Cron("05 * * * *")
	async cleanupExpiredSessions() {
		const result = await this.prisma.session.deleteMany({
			where: { expiresAt: { lt: new Date() } },
		});
		this.logger.log(LogBuilder.session.cleanupCompleted(result.count));
	}

	public async create(
		userUUID: string,
		jti: string,
		expiresAt: Date,
		userAgent: string,
		ipAddress: string,
	) {
		return this.prisma.session.create({
			data: {
				userUUID: userUUID,
				jti: jti,
				expiresAt: expiresAt,
				userAgent: userAgent,
				ipAddress: ipAddress,
			},
		});
	}

	public async getUserSessions(userUUID: string) {
		return this.prisma.session.findMany({ where: { userUUID: userUUID } });
	}

	public async removeSession(sessionId: number) {
		return this.prisma.session.delete({ where: { id: sessionId } });
	}

	public async isValidSession(userUUID: string, jti: UUID) {
		return this.prisma.session.findUnique({ where: { userUUID_jti: { userUUID, jti } } });
	}
}
