import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { z } from "zod";
import { ServerClientService } from "../server/server-client.service";
import { AppUnauthorizedException } from "../error/unauthorized";

const accessSchema = z.object({ sub: z.string().uuid(), scope: z.literal("access") });

@Injectable()
export class TokenService {
	constructor(
		private readonly jwt: JwtService,
		private readonly server: ServerClientService,
	) {}

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
