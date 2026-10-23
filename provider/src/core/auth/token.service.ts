import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { z } from "zod";
import { providerTokenScopes } from "@flex/shared";
import { PrismaService } from "../prisma/prisma.service";
import { ServerClientService } from "../server/server-client.service";
import { AppUnauthorizedException } from "../error/unauthorized";

const claimsSchema = z.object({ sub: z.string().uuid(), scope: z.enum(providerTokenScopes) });

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

	async verify(token: string) {
		const [publicKey, audience] = await Promise.all([
			this.server.getPublicKey(),
			this.getProviderUuid(),
		]);

		try {
			const payload: unknown = await this.jwt.verifyAsync(token, {
				publicKey,
				algorithms: ["RS256"],
				audience,
			});
			const claims = claimsSchema.parse(payload);
			return { userUuid: claims.sub, scope: claims.scope };
		} catch {
			throw new AppUnauthorizedException("INVALID_TOKEN", "Invalid or expired token");
		}
	}
}
