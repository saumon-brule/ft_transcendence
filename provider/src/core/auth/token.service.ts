import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { z } from "zod";
import { PrismaService } from "../prisma/prisma.service";
import { ServerClientService } from "../server/server-client.service";
import { AppUnauthorizedException } from "../error/unauthorized";

const accessSchema = z.object({ sub: z.string().uuid(), scope: z.literal("access") });
const accessRequestSchema = z.object({ sub: z.string().uuid(), aud: z.string().uuid(), scope: z.literal("access-request") });

@Injectable()
export class TokenService {
	private providerUuid: string | undefined;

	constructor(
		private readonly jwt: JwtService,
		private readonly server: ServerClientService,
		private readonly prisma: PrismaService,
	) {}

	private async getProviderUuid() {
		this.providerUuid ??= (
			await this.prisma.provider.findUniqueOrThrow({ where: { id: 1 }, select: { uuid: true } })
		).uuid;
		return this.providerUuid;
	}

	async verifyAccessRequest(token: string) {
		const publicKey = await this.server.getPublicKey();

		try {
			const payload: unknown = await this.jwt.verifyAsync(token, {
				publicKey,
				algorithms: ["RS256"],
				audience: await this.getProviderUuid(),
			});
			const claims = accessRequestSchema.parse(payload);
			return { userUuid: claims.sub, providerUuid: claims.aud, scope: claims.scope };
		} catch {
			throw new AppUnauthorizedException("INVALID_TOKEN", "Invalid or expired token");
		}
	}

	async verifyAccess(token: string) {
		const publicKey = await this.server.getPublicKey();

		try {
			const payload: unknown = await this.jwt.verifyAsync(token, {
				publicKey,
				algorithms: ["RS256"],
			});
			const claims = accessSchema.parse(payload);
			return { userUuid: claims.sub, scope: claims.scope };
		} catch {
			throw new AppUnauthorizedException("INVALID_TOKEN", "Invalid or expired token");
		}
	}
}
