import { Injectable } from "@nestjs/common";
import { JwtPayload } from "@flex/shared";
import { JwtService } from "@nestjs/jwt";
import { env } from "../core/env";

@Injectable()
export class SocketAuthService {
	constructor(private readonly jwtService: JwtService) {}

	async authenticate(token: unknown): Promise<{ userUUID: string; expiresAt: number | null }> {
		if (typeof token !== "string" || token.length === 0) {
			throw new Error("Missing token");
		}

		const payload = await this.jwtService.verifyAsync<JwtPayload & { exp?: number }>(token, {
			secret: env.JWT_SECRET,
		});

		if (typeof payload.sub !== "string" || payload.emailVerified !== true) {
			throw new Error("Invalid token payload");
		}

		return {
			userUUID: payload.sub,
			expiresAt: typeof payload.exp === "number"
				? payload.exp * 1000
				: null,
		};
	}
}
