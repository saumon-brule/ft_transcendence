import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ServerClientService } from '../server/server-client.service';

@Injectable()
export class PrismaBootstrapService implements OnModuleInit {
	constructor(
		private readonly prisma: PrismaService,
		private readonly server: ServerClientService,
	) {}

	async onModuleInit() {
		const identity = await this.server.getIdentity();

		await this.prisma.$transaction(async (tx) => {
			const owner = await tx.member.upsert({
				create: { uuid: identity.ownerUuid },
				update: { revokedAt: null, revokedById: null },
				where: { uuid: identity.ownerUuid },
			});

			await tx.provider.upsert({
				create: { id: 1, uuid: identity.uuid, ownerId: owner.id },
				update: { uuid: identity.uuid, ownerId: owner.id },
				where: { id: 1 },
			});
		});
	}
}
