import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { providerPermissions, type ProviderPermission } from "@flex/shared";
import { Prisma } from "../generated/client/client";
import { PrismaService } from "../core/prisma/prisma.service";

const include = { permissions: true } satisfies Prisma.RoleInclude;
type RoleRow = Prisma.RoleGetPayload<{ include: typeof include }>;

const toRole = (role: RoleRow, defaultRoleId: number | null) => ({
	uuid: role.uuid,
	name: role.name,
	isDefault: role.id === defaultRoleId,
	permissions: providerPermissions.filter((permission) =>
		role.permissions.some((link) => link.permission === permission),
	),
});

interface CreateRole {
	name: string;
	permissions: ProviderPermission[];
}

type UpdateRole = Partial<CreateRole>;

@Injectable()
export class RolesService {
	constructor(private readonly prisma: PrismaService) {}

	async list() {
		const [{ defaultRoleId }, roles] = await Promise.all([
			this.prisma.provider.findUniqueOrThrow({ where: { id: 1 } }),
			this.prisma.role.findMany({ include, orderBy: [{ name: "asc" }, { id: "asc" }] }),
		]);

		return { roles: roles.map((role) => toRole(role, defaultRoleId)) };
	}

	async create(dto: CreateRole, actorId: number) {
		const [{ defaultRoleId }, created] = await Promise.all([
			this.prisma.provider.findUniqueOrThrow({ where: { id: 1 } }),
			this.prisma.role.create({
				data: {
					name: dto.name,
					addedById: actorId,
					permissions: { create: [...new Set(dto.permissions)].map((permission) => ({ permission })) },
				},
				include,
			}),
		]);

		return toRole(created, defaultRoleId);
	}

	update(uuid: string, dto: UpdateRole) {
		return this.prisma.$transaction(async (tx) => {
			const role = await tx.role.findUnique({ where: { uuid }, select: { id: true } });
			if (!role) throw new NotFoundException("Role not found");

			if (dto.name !== undefined) {
				await tx.role.update({ where: { id: role.id }, data: { name: dto.name } });
			}

			if (dto.permissions !== undefined) {
				await tx.rolePermission.deleteMany({ where: { roleId: role.id } });
				await tx.rolePermission.createMany({
					data: [...new Set(dto.permissions)].map((permission) => ({ roleId: role.id, permission })),
				});
			}

			const [{ defaultRoleId }, updated] = await Promise.all([
				tx.provider.findUniqueOrThrow({ where: { id: 1 } }),
				tx.role.findUniqueOrThrow({ where: { id: role.id }, include }),
			]);
			return toRole(updated, defaultRoleId);
		});
	}

	async remove(uuid: string) {
		const [{ defaultRoleId }, role] = await Promise.all([
			this.prisma.provider.findUniqueOrThrow({ where: { id: 1 } }),
			this.prisma.role.findUnique({ where: { uuid }, select: { id: true } }),
		]);
		if (!role) throw new NotFoundException("Role not found");
		if (role.id === defaultRoleId) {
			throw new ConflictException("The default role cannot be deleted, choose another default role first");
		}

		await this.prisma.role.delete({ where: { id: role.id } });
	}
}
