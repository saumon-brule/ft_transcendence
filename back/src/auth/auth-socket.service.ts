import { Injectable } from "@nestjs/common";
import { JwtPayload } from "@flex/shared";
import { JwtService } from "@nestjs/jwt";
import { env } from "../core/env";

@Injectable()
export class SocketAuthService {
	constructor(private readonly jwtService: JwtService) {}

	async authenticate(token: unknown): Promise<{ userUUID: string }> {
		if (typeof token !== "string" || token.length === 0) {
			throw new Error("Missing token");
		}

		const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
			secret: env.JWT_SECRET,
		});

		if (typeof payload.sub !== "string" || payload.emailVerified !== true) {
			throw new Error("Invalid token payload");
		}

		return { userUUID: payload.sub };
	}
}
