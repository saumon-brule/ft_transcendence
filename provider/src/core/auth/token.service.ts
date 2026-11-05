import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { z } from "zod";
import { ServerClientService } from "../server/server-client.service";
import { PrismaService } from "../prisma/prisma.service";
import { AppUnauthorizedException } from "../error/unauthorized";

const accessSchema = z.object({ sub: z.string().uuid(), scope: z.literal("access") });

@Injectable()
export class TokenService {
	constructor(
		private readonly jwt: JwtService,
		private readonly server: ServerClientService,
		private readonly prisma: PrismaService,
	) {}

	private ownUuid: string | undefined;

	private async getOwnUuid() {
		this.ownUuid ??= (await this.prisma.provider.findUniqueOrThrow({
			where: { id: 1 },
			select: { uuid: true },
		})).uuid;
		return this.ownUuid;
	}

	async verifyAccess(token: string) {
		const [publicKey, audience] = await Promise.all([this.server.getPublicKey(), this.getOwnUuid()]);

		try {
			const payload: unknown = await this.jwt.verifyAsync(token, {
				publicKey,
				algorithms: ["RS256"],
				audience,
			});
			const claims = accessSchema.parse(payload);
			return { userUuid: claims.sub, scope: claims.scope };
		} catch {
			throw new AppUnauthorizedException("INVALID_TOKEN", "Invalid or expired token");
		}
	}
}
