import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../core/prisma/prisma.service";
import { ServerClientService } from "../core/server/server-client.service";
import type { MemberContext } from "../core/auth/auth.types";
import { AppForbiddenException } from "../core/error/forbidden";

export const memberInclude = {
	roles: { include: { role: true }, orderBy: { role: { name: "asc" } } },
} satisfies Prisma.MemberInclude;
type MemberRow = Prisma.MemberGetPayload<{ include: typeof memberInclude }>;

export const toMember = (member: MemberRow, ownerUuid: string) => ({
	uuid: member.uuid,
	isOwner: member.uuid === ownerUuid,
	revokedAt: member.revokedAt,
	createdAt: member.createdAt,
	roles: member.roles.map((link) => ({ uuid: link.role.uuid, name: link.role.name })),
});

interface ListQuery {
	revoked?: boolean;
}

@Injectable()
export class MemberService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly server: ServerClientService,
	) {}

	me(member: MemberContext) {
		return {
			uuid: member.uuid,
			isOwner: member.isOwner,
			roles: member.roles,
			permissions: member.permissions,
		};
	}

	async list({ revoked }: ListQuery) {
		const where: Prisma.MemberWhereInput = revoked === undefined
			? {}
			: { revokedAt: revoked
				? { not: null }
				: null };

		const [{ ownerUuid }, rows] = await Promise.all([
			this.prisma.provider.findUniqueOrThrow({ where: { id: 1 } }),
			this.prisma.member.findMany({
				where,
				include: memberInclude,
				orderBy: [{ createdAt: "asc" }, { id: "asc" }],
			}),
		]);

		return { members: rows.map((row) => toMember(row, ownerUuid)) };
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

		await this.server.revokeMember(uuid);

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

			return this.fetchMember(tx, uuid);
		});
	}

	async addRole(uuid: string, roleUuid: string) {
		await this.prisma.$transaction(async (tx) => {
			const member = await tx.member.findUnique({ where: { uuid } });
			if (!member || member.revokedAt) throw new NotFoundException("Member not found");

			const role = await tx.role.findUnique({ where: { uuid: roleUuid } });
			if (!role) throw new NotFoundException("Role not found");

			await tx.memberRole.createMany({
				data: [{ memberUuid: uuid, roleUuid }],
				skipDuplicates: true,
			});
		});
	}

	async removeRole(uuid: string, roleUuid: string) {
		await this.prisma.$transaction(async (tx) => {
			const member = await tx.member.findUnique({ where: { uuid } });
			if (!member || member.revokedAt) throw new NotFoundException("Member not found");

			const role = await tx.role.findUnique({ where: { uuid: roleUuid } });
			if (!role) throw new NotFoundException("Role not found");

			await tx.memberRole.deleteMany({ where: { memberUuid: uuid, roleUuid } });
		});
	}

	private async fetchMember(tx: Prisma.TransactionClient, uuid: string) {
		const [{ ownerUuid }, updated] = await Promise.all([
			tx.provider.findUniqueOrThrow({ where: { id: 1 } }),
			tx.member.findUniqueOrThrow({ where: { uuid }, include: memberInclude }),
		]);
		return toMember(updated, ownerUuid);
	}
}
