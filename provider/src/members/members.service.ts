import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../core/prisma/prisma.service";
import type { MemberContext } from "../core/auth/auth.types";
import { AppForbiddenException } from "../core/error/forbidden";

const include = {
	roles: { include: { role: true }, orderBy: { role: { name: "asc" } } },
} satisfies Prisma.MemberInclude;
type MemberRow = Prisma.MemberGetPayload<{ include: typeof include }>;

const toMember = (member: MemberRow, ownerId: number) => ({
	uuid: member.uuid,
	isOwner: member.id === ownerId,
	revokedAt: member.revokedAt,
	createdAt: member.createdAt,
	roles: member.roles.map((link) => ({ uuid: link.role.uuid, name: link.role.name })),
});

interface ListQuery {
	limit: number;
	offset: number;
	revoked?: boolean;
}

@Injectable()
export class MembersService {
	constructor(private readonly prisma: PrismaService) {}

	me(member: MemberContext) {
		return {
			uuid: member.uuid,
			isOwner: member.isOwner,
			roles: member.roles,
			permissions: member.permissions,
		};
	}

	async list({ limit, offset, revoked }: ListQuery) {
		const where: Prisma.MemberWhereInput = revoked === undefined
			? {}
			: { revokedAt: revoked
				? { not: null }
				: null };

		const [{ ownerId }, rows, total] = await Promise.all([
			this.prisma.provider.findUniqueOrThrow({ where: { id: 1 } }),
			this.prisma.member.findMany({
				where,
				include,
				orderBy: [{ createdAt: "asc" }, { id: "asc" }],
				take: limit,
				skip: offset,
			}),
			this.prisma.member.count({ where }),
		]);

		return { members: rows.map((row) => toMember(row, ownerId)), total };
	}

	async revoke(uuid: string, actorId: number) {
		const [{ ownerId }, member] = await Promise.all([
			this.prisma.provider.findUniqueOrThrow({ where: { id: 1 } }),
			this.prisma.member.findUnique({ where: { uuid } }),
		]);
		if (!member) throw new NotFoundException("Member not found");
		if (member.id === ownerId) {
			throw new AppForbiddenException("FORBIDDEN", "The owner cannot be revoked");
		}
		if (member.revokedAt) return;

		await this.prisma.$transaction([
			this.prisma.memberRole.deleteMany({ where: { memberId: member.id } }),
			this.prisma.member.update({
				where: { id: member.id },
				data: { revokedAt: new Date(), revokedById: actorId },
			}),
		]);
	}

	setRoles(uuid: string, roleUuids: string[]) {
		return this.prisma.$transaction(async (tx) => {
			const member = await tx.member.findUnique({ where: { uuid } });
			if (!member || member.revokedAt) throw new NotFoundException("Member not found");

			const unique = [...new Set(roleUuids)];
			const roles = await tx.role.findMany({
				where: { uuid: { in: unique } },
				select: { id: true },
			});
			if (roles.length !== unique.length) throw new NotFoundException("Role not found");

			await tx.memberRole.deleteMany({ where: { memberId: member.id } });
			await tx.memberRole.createMany({
				data: roles.map((role) => ({ memberId: member.id, roleId: role.id })),
			});

			const [{ ownerId }, updated] = await Promise.all([
				tx.provider.findUniqueOrThrow({ where: { id: 1 } }),
				tx.member.findUniqueOrThrow({ where: { id: member.id }, include }),
			]);
			return toMember(updated, ownerId);
		});
	}
}
