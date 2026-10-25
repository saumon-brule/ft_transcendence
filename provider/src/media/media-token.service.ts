import { ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { PrismaService } from "../core/prisma/prisma.service";

const TOKEN_TTL_SECONDS = 24 * 3600;
const MEMBER_STATUS_TTL_MS = 30_000;
const MEMBER_STATUS_CACHE_MAX = 10_000;
const MEDIA_SCOPE = "media";

const claimsSchema = z.object({
	sub: z.string().uuid(),
	scope: z.literal(MEDIA_SCOPE),
});

@Injectable()
export class MediaTokenService {
	private readonly secret = randomBytes(32).toString("hex");
	private readonly statusCache = new Map<string, { active: boolean; expiresAt: number }>();

	constructor(
		private readonly jwt: JwtService,
		private readonly prisma: PrismaService,
	) {}

	async issue(memberUuid: string) {
		const token = await this.jwt.signAsync({ scope: MEDIA_SCOPE }, {
			secret: this.secret,
			algorithm: "HS256",
			subject: memberUuid,
			expiresIn: TOKEN_TTL_SECONDS,
		});

		return { token, expiresAt: new Date(Date.now() + TOKEN_TTL_SECONDS * 1000) };
	}

	async authorize(token: string) {
		let claims: z.infer<typeof claimsSchema>;
		try {
			const payload: unknown = await this.jwt.verifyAsync(token, {
				secret: this.secret,
				algorithms: ["HS256"],
			});
			claims = claimsSchema.parse(payload);
		} catch {
			throw new UnauthorizedException({
				code: "INVALID_TOKEN",
				message: "Invalid or expired media token",
			});
		}

		if (!await this.isActiveMember(claims.sub)) {
			throw new ForbiddenException({
				code: "MEMBER_REVOKED",
				message: "Your access to this provider has been revoked",
			});
		}
	}

	private async isActiveMember(memberUuid: string) {
		const now = Date.now();
		const cached = this.statusCache.get(memberUuid);
		if (cached && cached.expiresAt > now) return cached.active;

		const member = await this.prisma.member.findUnique({
			where: { uuid: memberUuid },
			select: { revokedAt: true },
		});
		const active = member !== null && member.revokedAt === null;

		if (this.statusCache.size >= MEMBER_STATUS_CACHE_MAX) {
			for (const [key, entry] of this.statusCache) {
				if (entry.expiresAt <= now) this.statusCache.delete(key);
			}
			if (this.statusCache.size >= MEMBER_STATUS_CACHE_MAX) this.statusCache.clear();
		}
		this.statusCache.set(memberUuid, { active, expiresAt: now + MEMBER_STATUS_TTL_MS });
		return active;
	}
}
