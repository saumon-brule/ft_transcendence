import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "../generated/client/client";
import { PrismaService } from "../core/prisma/prisma.service";

const include = { owner: true, defaultRole: true } satisfies Prisma.ProviderInclude;
type ProviderRow = Prisma.ProviderGetPayload<{ include: typeof include }>;

const toSettings = (provider: ProviderRow) => ({
	ownerUuid: provider.owner.uuid,
	visibility: provider.visibility,
	defaultRoleUuid: provider.defaultRole?.uuid ?? null,
});

interface UpdateSettings {
	visibility?: "PUBLIC" | "PRIVATE";
	defaultRoleUuid?: string | null;
}

@Injectable()
export class SettingsService {
	constructor(private readonly prisma: PrismaService) {}

	async get() {
		const provider = await this.prisma.provider.findUniqueOrThrow({ where: { id: 1 }, include });
		return toSettings(provider);
	}

	update(dto: UpdateSettings) {
		return this.prisma.$transaction(async (tx) => {
			const data: Prisma.ProviderUncheckedUpdateInput = {};
			if (dto.visibility !== undefined) data.visibility = dto.visibility;

			if (dto.defaultRoleUuid !== undefined) {
				if (dto.defaultRoleUuid === null) {
					data.defaultRoleId = null;
				} else {
					const role = await tx.role.findUnique({
						where: { uuid: dto.defaultRoleUuid },
						select: { id: true },
					});
					if (!role) throw new NotFoundException("Role not found");
					data.defaultRoleId = role.id;
				}
			}

			const updated = await tx.provider.update({ where: { id: 1 }, data, include });
			return toSettings(updated);
		});
	}
}
