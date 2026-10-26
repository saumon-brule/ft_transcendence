import { Injectable } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../core/prisma/prisma.service";
import { parseApiKey } from "./providersAPIKey";

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
	reason: "MALFORMED" | "UNKNOWN" | "PROVIDER_MISMATCH";
}

const providerDetailInclude = { owner: true } satisfies Prisma.ProviderInclude;

type ProviderDetail = Prisma.ProviderGetPayload<{ include: typeof providerDetailInclude }>;

const toAuthenticatedProvider = (provider: ProviderDetail) => ({
	id: provider.id,
	uuid: provider.uuid,
	ownerUuid: provider.owner.uuid,
});

export type ApiKeyVerification = ApiKeyAccepted | ApiKeyRejected;

@Injectable()
export class ProviderApiKeysService {
	constructor(private readonly prisma: PrismaService) {}

	async verify(rawKey: string): Promise<ApiKeyVerification> {
		const parsed = parseApiKey(rawKey);
		if (!parsed) return { ok: false, reason: "MALFORMED" };

		const provider = await this.prisma.provider.findUnique({
			where: { hashedKey: parsed.keyHash },
			include: providerDetailInclude,
		});
		if (!provider) return { ok: false, reason: "UNKNOWN" };
		if (provider.uuid !== parsed.providerUuid) return { ok: false, reason: "PROVIDER_MISMATCH" };

		return {
			ok: true,
			provider: toAuthenticatedProvider(provider),
		};
	}
}
