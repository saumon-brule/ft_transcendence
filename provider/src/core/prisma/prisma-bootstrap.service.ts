import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { AccessRequestService } from "../../access-request/access-request.service";
import { ServerAuthError, ServerClientService } from "../server/server-client.service";

@Injectable()
export class PrismaBootstrapService implements OnModuleInit {
	private readonly logger = new Logger(PrismaBootstrapService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly server: ServerClientService,
		private readonly accessRequests: AccessRequestService,
	) {}

	async onModuleInit() {
		await this.syncIdentity();
		await this.acceptPendingRequests();
	}

	private async acceptPendingRequests() {
		try {
			await this.accessRequests.acceptAllPending();
		} catch (error) {
			this.logger.warn(`Could not accept the pending access requests: ${(error as Error).message}`);
		}
	}

	private async syncIdentity() {
		let identity;
		try {
			identity = await this.server.getIdentity();
		} catch (error) {
			if (error instanceof ServerAuthError) throw error;

			const stored = await this.prisma.provider.findUnique({ where: { id: 1 } });
			if (!stored) throw error;

			this.logger.warn(`Server unreachable (${(error as Error).message}), keeping the stored identity`);
			return;
		}

		await this.prisma.$transaction(async (tx) => {
			await tx.member.upsert({
				create: { uuid: identity.ownerUuid },
				update: { revokedAt: null, revokedByUuid: null },
				where: { uuid: identity.ownerUuid },
			});

			await tx.provider.upsert({
				create: { id: 1, uuid: identity.uuid, ownerUuid: identity.ownerUuid },
				update: { uuid: identity.uuid, ownerUuid: identity.ownerUuid },
				where: { id: 1 },
			});
		});
	}
}
