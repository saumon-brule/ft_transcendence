import { Injectable, NotFoundException } from "@nestjs/common";
import { providerPermissions, type ProviderPermission } from "@flex/shared";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../core/prisma/prisma.service";

const include = { permissions: true } satisfies Prisma.RoleInclude;
type RoleRow = Prisma.RoleGetPayload<{ include: typeof include }>;

const toRole = (role: RoleRow, defaultRoleUuid: string | null) => ({
	uuid: role.uuid,
	name: role.name,
	isDefault: role.uuid === defaultRoleUuid,
	permissions: providerPermissions.filter((permission) => role.permissions.some((link) => link.permission === permission)),
});

interface CreateRole {
	name: string;
	permissions: ProviderPermission[];
}

type UpdateRole = Partial<CreateRole>;

@Injectable()
export class RoleService {
	constructor(private readonly prisma: PrismaService) {}

	async list() {
		const [{ defaultRoleUuid }, roles] = await Promise.all([
			this.prisma.provider.findUniqueOrThrow({ where: { id: 1 } }),
			this.prisma.role.findMany({ include, orderBy: [{ name: "asc" }, { id: "asc" }] }),
		]);

		return { roles: roles.map((role) => toRole(role, defaultRoleUuid)) };
	}

	async create(dto: CreateRole, actorUuid: string) {
		const created = await this.prisma.role.create({
			data: {
				name: dto.name,
				addedByUuid: actorUuid,
				permissions: { create: [...new Set(dto.permissions)].map((permission) => ({ permission })) },
			},
			include,
		});

		return toRole(created, null);
	}

	update(uuid: string, dto: UpdateRole) {
		return this.prisma.$transaction(async (tx) => {
			const role = await tx.role.findUnique({ where: { uuid }, select: { id: true } });
			if (!role) throw new NotFoundException("Role not found");

			if (dto.name !== undefined) {
				await tx.role.update({ where: { uuid }, data: { name: dto.name } });
			}

			if (dto.permissions !== undefined) {
				await tx.rolePermission.deleteMany({ where: { roleUuid: uuid } });
				await tx.rolePermission.createMany({
					data: [...new Set(dto.permissions)].map((permission) => ({ roleUuid: uuid, permission })),
				});
			}

			const [{ defaultRoleUuid }, updated] = await Promise.all([
				tx.provider.findUniqueOrThrow({ where: { id: 1 } }),
				tx.role.findUniqueOrThrow({ where: { uuid }, include }),
			]);
			return toRole(updated, defaultRoleUuid);
		});
	}

	async remove(uuid: string) {
		const role = await this.prisma.role.findUnique({ where: { uuid }, select: { id: true } });
		if (!role) throw new NotFoundException("Role not found");

		await this.prisma.role.delete({ where: { id: role.id } });
	}
}
