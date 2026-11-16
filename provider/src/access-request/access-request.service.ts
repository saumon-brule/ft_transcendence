import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../core/prisma/prisma.service";
import { retryOnWriteConflict } from "../core/prisma/write-conflict";
import { AppConflictException } from "../core/error/conflict";
import { ServerClientService } from "../core/server/server-client.service";

const TRANSACTION = { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15_000, maxWait: 5_000 };

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
export class AccessRequestService {
	private readonly logger = new Logger(AccessRequestService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly server: ServerClientService,
	) {}

	private async grantMembership(tx: Prisma.TransactionClient, userUuid: string, defaultRoleUuid: string | null) {
		await tx.member.upsert({
			where: { uuid: userUuid },
			create: { uuid: userUuid },
			update: { revokedAt: null, revokedByUuid: null },
		});

		if (defaultRoleUuid !== null) {
			await tx.memberRole.upsert({
				where: { memberUuid_roleUuid: { memberUuid: userUuid, roleUuid: defaultRoleUuid } },
				create: { memberUuid: userUuid, roleUuid: defaultRoleUuid },
				update: {},
			});
		}
	}

	async create(userUuid: string) {
		const provider = await this.prisma.provider.findUniqueOrThrow({ where: { id: 1 } });
		const isPublic = provider.visibility === "PUBLIC";

		if (await this.server.getAccessRequestStatus(userUuid) !== "PENDING") {
			throw new NotFoundException("No pending access request registered on the server for this provider");
		}

		//	retryOnWriteConflict retry 4 times the function passed in parameter catching error
		//	if TransactionWriteConflict happens during transaction that can appear because of
		//	isolationLevel: Serializable
		//	else for any other error throw it normally
		const created = await retryOnWriteConflict(() => this.prisma.$transaction(async (tx) => {
			const member = await tx.member.findUnique({ where: { uuid: userUuid } });
			if (member && !member.revokedAt) {
				throw new AppConflictException("ALREADY_MEMBER", "You are already a member of this provider");
			}

			const pending = await tx.accessRequest.findFirst({ where: { userUuid, status: "PENDING" } });
			if (pending) {
				throw new AppConflictException("ALREADY_PENDING", "An access request is already pending");
			}

			if (isPublic) {
				await this.server.decideAccessRequest(userUuid, "APPROVED");
				await this.grantMembership(tx, userUuid, provider.defaultRoleUuid);
			}

			return tx.accessRequest.create({
				data: {
					userUuid,
					status: isPublic
						? "APPROVED"
						: "PENDING",
					decidedAt: isPublic
						? new Date()
						: null,
				},
				include,
			});
		}, TRANSACTION));

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
		const where: Prisma.AccessRequestWhereInput = status
			? { status }
			: {};

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

	async acceptAllPending() {
		const provider = await this.prisma.provider.findUnique({ where: { id: 1 } });
		if (provider?.visibility !== "PUBLIC") return 0;

		const pending = await this.prisma.accessRequest.findMany({
			where: { status: "PENDING" },
			orderBy: { createdAt: "asc" },
		});

		let accepted = 0;
		for (const request of pending) {
			try {
				await this.decide(request.uuid, "APPROVED", null);
				accepted++;
			} catch (error) {
				this.logger.warn(`Could not accept access request ${request.uuid}: ${(error as Error).message}`);
			}
		}

		if (pending.length > 0) this.logger.log(`Accepted ${accepted}/${pending.length} pending access requests`);
		return accepted;
	}

	decide(uuid: string, decision: "APPROVED" | "REJECTED", actorUuid: string | null) {
		return retryOnWriteConflict(() => this.prisma.$transaction(async (tx) => {
			const request = await tx.accessRequest.findUnique({ where: { uuid } });
			if (!request) throw new NotFoundException("Access request not found");
			if (request.status !== "PENDING") {
				throw new AppConflictException("ALREADY_DECIDED", "This access request has already been decided");
			}

			await this.server.decideAccessRequest(request.userUuid, decision);

			if (decision === "APPROVED") {
				const provider = await tx.provider.findUniqueOrThrow({ where: { id: 1 } });
				await this.grantMembership(tx, request.userUuid, provider.defaultRoleUuid);
			}

			const updated = await tx.accessRequest.update({
				where: { uuid },
				data: { status: decision, decidedByUuid: actorUuid, decidedAt: new Date() },
				include,
			});
			return toAccessRequest(updated);
		}, TRANSACTION));
	}
}
