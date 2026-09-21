import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "../generated/client/client";
import { PrismaService } from "../core/prisma/prisma.service";
import { retryOnWriteConflict } from "../core/prisma/write-conflict";

const include = { decidedBy: true } satisfies Prisma.AccessRequestInclude;
type AccessRequestRow = Prisma.AccessRequestGetPayload<{ include: typeof include }>;

const toAccessRequest = (request: AccessRequestRow) => ({
	uuid: request.uuid,
	userUuid: request.userUuid,
	status: request.status,
	decidedBy: request.decidedBy?.uuid ?? null,
	decidedAt: request.decidedAt,
	createdAt: request.createdAt,
});

interface ListQuery {
	limit: number;
	offset: number;
	status?: "PENDING" | "APPROVED" | "REJECTED";
}

@Injectable()
export class AccessRequestsService {
	constructor(private readonly prisma: PrismaService) {}

	private async grantMembership(tx: Prisma.TransactionClient, userUuid: string, defaultRoleId: number | null) {
		const member = await tx.member.upsert({
			where: { uuid: userUuid },
			create: { uuid: userUuid },
			update: { revokedAt: null, revokedById: null },
		});

		if (defaultRoleId !== null) {
			await tx.memberRole.upsert({
				where: { memberId_roleId: { memberId: member.id, roleId: defaultRoleId } },
				create: { memberId: member.id, roleId: defaultRoleId },
				update: {},
			});
		}
	}

	async create(userUuid: string) {
		const provider = await this.prisma.provider.findUniqueOrThrow({ where: { id: 1 } });
		const isPublic = provider.visibility === "PUBLIC";

		const created = await retryOnWriteConflict(() => this.prisma.$transaction(async (tx) => {
			const member = await tx.member.findUnique({ where: { uuid: userUuid } });
			if (member && !member.revokedAt) {
				throw new ConflictException("You are already a member of this provider");
			}

			const pending = await tx.accessRequest.findFirst({ where: { userUuid, status: "PENDING" } });
			if (pending) {
				throw new ConflictException("An access request is already pending");
			}

			if (isPublic) {
				await this.grantMembership(tx, userUuid, provider.defaultRoleId);
			}

			return tx.accessRequest.create({
				data: {
					userUuid,
					status: isPublic ? "APPROVED" : "PENDING",
					decidedAt: isPublic ? new Date() : null,
				},
				include,
			});
		}, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));

		return toAccessRequest(created);
	}

	async getMine(userUuid: string) {
		const request = await this.prisma.accessRequest.findFirst({
			where: { userUuid },
			orderBy: { createdAt: "desc" },
			include,
		});
		if (!request) throw new NotFoundException("No access request found");

		return toAccessRequest(request);
	}

	async list({ limit, offset, status }: ListQuery) {
		const where: Prisma.AccessRequestWhereInput = status ? { status } : {};

		const [rows, total] = await this.prisma.$transaction([
			this.prisma.accessRequest.findMany({
				where,
				include,
				orderBy: { createdAt: "desc" },
				take: limit,
				skip: offset,
			}),
			this.prisma.accessRequest.count({ where }),
		]);

		return { accessRequests: rows.map(toAccessRequest), total };
	}

	decide(uuid: string, decision: "APPROVED" | "REJECTED", actorId: number) {
		return retryOnWriteConflict(() => this.prisma.$transaction(async (tx) => {
			const request = await tx.accessRequest.findUnique({ where: { uuid } });
			if (!request) throw new NotFoundException("Access request not found");
			if (request.status !== "PENDING") {
				throw new ConflictException("This access request has already been decided");
			}

			if (decision === "APPROVED") {
				const provider = await tx.provider.findUniqueOrThrow({ where: { id: 1 } });
				await this.grantMembership(tx, request.userUuid, provider.defaultRoleId);
			}

			const updated = await tx.accessRequest.update({
				where: { id: request.id },
				data: { status: decision, decidedById: actorId, decidedAt: new Date() },
				include,
			});
			return toAccessRequest(updated);
		}, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
	}
}
