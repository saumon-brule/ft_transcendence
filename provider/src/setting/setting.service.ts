import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../core/prisma/prisma.service";

const include = { owner: true, defaultRole: true } satisfies Prisma.ProviderInclude;
type ProviderRow = Prisma.ProviderGetPayload<{ include: typeof include }>;

const toSetting = (provider: ProviderRow) => ({
	ownerUuid: provider.owner.uuid,
	visibility: provider.visibility,
	defaultRoleUuid: provider.defaultRole?.uuid ?? null,
});

interface UpdateSetting {
	visibility?: "PUBLIC" | "PRIVATE";
	defaultRoleUuid?: string | null;
}

@Injectable()
export class SettingService {
	constructor(private readonly prisma: PrismaService) {}

	async get() {
		const provider = await this.prisma.provider.findUniqueOrThrow({ where: { id: 1 }, include });
		return toSetting(provider);
	}

	update(dto: UpdateSetting) {
		return this.prisma.$transaction(async (tx) => {
			const data: Prisma.ProviderUncheckedUpdateInput = {};
			if (dto.visibility !== undefined) data.visibility = dto.visibility;

			if (dto.defaultRoleUuid !== undefined) {
				if (dto.defaultRoleUuid === null) {
					data.defaultRoleUuid = null;
				} else {
					const role = await tx.role.findUnique({
						where: { uuid: dto.defaultRoleUuid },
						select: { id: true },
					});
					if (!role) throw new NotFoundException("Role not found");
					data.defaultRoleUuid = dto.defaultRoleUuid;
				}
			}

			const updated = await tx.provider.update({ where: { id: 1 }, data, include });
			return toSetting(updated);
		});
	}
}
