import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../core/prisma/prisma.service";
import type { MemberContext } from "../core/auth/auth.types";
import { AppForbiddenException } from "../core/error/forbidden";

const include = {
	roles: { include: { role: true }, orderBy: { role: { name: "asc" } } },
} satisfies Prisma.MemberInclude;
type MemberRow = Prisma.MemberGetPayload<{ include: typeof include }>;

const toMember = (member: MemberRow, ownerUuid: string) => ({
	uuid: member.uuid,
	isOwner: member.uuid === ownerUuid,
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

		const [{ ownerUuid }, rows, total] = await Promise.all([
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

		return { members: rows.map((row) => toMember(row, ownerUuid)), total };
	}

	async revoke(uuid: string, actorUuid: string) {
		const [{ ownerUuid }, member] = await Promise.all([
			this.prisma.provider.findUniqueOrThrow({ where: { id: 1 } }),
			this.prisma.member.findUnique({ where: { uuid } }),
		]);
		if (!member) throw new NotFoundException("Member not found");
		if (uuid === ownerUuid) {
			throw new AppForbiddenException("FORBIDDEN", "The owner cannot be revoked");
		}
		if (member.revokedAt) return;

		await this.prisma.$transaction([
			this.prisma.memberRole.deleteMany({ where: { memberUuid: uuid } }),
			this.prisma.member.update({
				where: { uuid },
				data: { revokedAt: new Date(), revokedByUuid: actorUuid },
			}),
		]);
	}

	setRoles(uuid: string, roleUuids: string[]) {
		return this.prisma.$transaction(async (tx) => {
			const member = await tx.member.findUnique({ where: { uuid } });
			if (!member || member.revokedAt) throw new NotFoundException("Member not found");

			const unique = [...new Set(roleUuids)];
			const found = await tx.role.count({ where: { uuid: { in: unique } } });
			if (found !== unique.length) throw new NotFoundException("Role not found");

			await tx.memberRole.deleteMany({ where: { memberUuid: uuid } });
			await tx.memberRole.createMany({
				data: unique.map((roleUuid) => ({ memberUuid: uuid, roleUuid })),
			});

			const [{ ownerUuid }, updated] = await Promise.all([
				tx.provider.findUniqueOrThrow({ where: { id: 1 } }),
				tx.member.findUniqueOrThrow({ where: { uuid }, include }),
			]);
			return toMember(updated, ownerUuid);
		});
	}
}
