import { Injectable } from "@nestjs/common";
import { PrismaService } from "../core/prisma/prisma.service";
import { parseApiKey } from "./provider-api-key";

export interface AuthenticatedProvider {
	id: number;
	uuid: string;
	ownerUuid: string;
}

interface ApiKeyAccepted {
	ok: true;
	provider: AuthenticatedProvider;
}

interface ApiKeyRejected {
	ok: false;
	reason: "MALFORMED" | "UNKNOWN" | "REVOKED" | "PROVIDER_MISMATCH";
}

export type ApiKeyVerification = ApiKeyAccepted | ApiKeyRejected;

@Injectable()
export class ProviderApiKeysService {
	constructor(private readonly prisma: PrismaService) {}

	/**
	 * La raison d'un refus sert aux logs uniquement : le client reçoit toujours la même réponse,
	 * pour ne pas lui apprendre si un provider ou une clé existe.
	 */
	async verify(rawKey: string): Promise<ApiKeyVerification> {
		const parsed = parseApiKey(rawKey);
		if (!parsed) return { ok: false, reason: "MALFORMED" };

		const apiKey = await this.prisma.providerApiKey.findUnique({
			where: { keyHash: parsed.keyHash },
			select: {
				id: true,
				revokedAt: true,
				provider: { select: { id: true, uuid: true, owner: { select: { uuid: true } } } },
			},
		});
		if (!apiKey) return { ok: false, reason: "UNKNOWN" };
		if (apiKey.revokedAt) return { ok: false, reason: "REVOKED" };
		if (apiKey.provider.uuid !== parsed.providerUuid) return { ok: false, reason: "PROVIDER_MISMATCH" };

		await this.prisma.providerApiKey.update({
			where: { id: apiKey.id },
			data: { lastUsedAt: new Date() },
		});

		return {
			ok: true,
			provider: {
				id: apiKey.provider.id,
				uuid: apiKey.provider.uuid,
				ownerUuid: apiKey.provider.owner.uuid,
			},
		};
	}
}
