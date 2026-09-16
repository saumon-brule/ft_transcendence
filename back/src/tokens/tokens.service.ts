import { Injectable } from "@nestjs/common";
import { PrismaService } from "../core/prisma/prisma.service";
import { randomBytes } from "crypto";
import { TokenPurpose } from "../generated/prisma/enums";
import { AppUnauthorizedException } from "../core/error/unauthorized";
import { Cron } from "@nestjs/schedule";
import { WinstonLoggerService } from "../core/logging/logger.service";
import { LogBuilder } from "../core/logging/log-builder";

export type TokenCreationParam<T extends TokenPurpose>
	= T extends "EMAIL_RESET" ? { userId: number; data: { newEmail: string } }
		: T extends "STATE_42AUTH" ? null
			: { userId: number };

@Injectable()
export class TokensService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly logger: WinstonLoggerService,
	) {}

	@Cron("0 * * * *")
	async clearExpiredTokens() {
		const result = await this.prisma.token.deleteMany({
			where: { expiresAt: { lt: new Date() } },
		});
		this.logger.log(LogBuilder.token.cleanupCompleted(result.count));
	}

	public async createConfirmEmailToken(userId: number) {
		return await this.createToken(userId, "EMAIL_VERIFICATION");
	}

	public async createResetPasswordToken(userId: number) {
		return await this.createToken(userId, "PASSWORD_RESET");
	}

	public async createResetEmailToken(userId: number, newEmail: string) {
		return await this.createToken(userId, "EMAIL_RESET", { newEmail });
	}

	public async create42AuthStateToken() {
		return await this.createToken(null, "STATE_42AUTH");
	}

	public async create42LinkStateToken(userId: number) {
		return await this.createToken(userId, "STATE_42LINK");
	}

	private async createToken(
		userId: number | null,
		tokenPurpose: TokenPurpose,
		data: object | undefined = undefined,
	) {
		const token = randomBytes(32).toString("hex");
		await this.prisma.token.create({
			data: {
				token: token,
				purpose: tokenPurpose,
				userId,
				data,
				expiresAt: new Date(Date.now() + 15 * 60 * 1000),
			},
		});
		this.logger.log(LogBuilder.token.created(tokenPurpose, userId ?? undefined));
		return token;
	}

	public async isValidToken<T extends TokenPurpose>(
		tokenStr: string,
		purpose: T,
	): Promise<TokenCreationParam<T>> {
		const token = await this.prisma.token.findUnique({
			where: { token: tokenStr },
		});

		if (token) await this.prisma.token.delete({ where: { id: token.id } });

		if (!token || purpose != token.purpose || token.expiresAt < new Date()) {
			this.logger.warn(
				LogBuilder.token.validationFailed(
					purpose,
					!token
						? "Token not found"
						: token.purpose !== purpose
							? "Purpose mismatch"
							: "Token expired",
				),
			);
			throw new AppUnauthorizedException(
				"UNAUTHORIZED",
				"Invalid or expired token",
			);
		}

		this.logger.log(LogBuilder.token.validated(purpose, token.userId ?? undefined));
		return (
			purpose === "EMAIL_RESET"
				? { userId: token.userId, data: token.data }
				: purpose === "STATE_42AUTH"
					? null
					: { userId: token.userId }
		) as TokenCreationParam<typeof purpose>;
	}
}
