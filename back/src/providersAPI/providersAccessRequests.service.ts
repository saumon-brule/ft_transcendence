import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../core/prisma/prisma.service";

type Decision = "APPROVED" | "REJECTED";

@Injectable()
export class ProviderAccessRequestsService {
	constructor(private readonly prisma: PrismaService) {}

	async request(userUUID: string, providerUUID: string) {
		const provider = await this.prisma.provider.findUnique({ where: { uuid: providerUUID }, select: { uuid: true } });
		if (!provider) throw new NotFoundException("Provider not found");

		const key = { providerUUID_userUUID: { providerUUID, userUUID } };
		if (await this.prisma.providerUser.findUnique({ where: key })) {
			throw new ConflictException("You are already a member of this provider");
		}

		return this.prisma.providerAccessRequest.upsert({
			where: key,
			create: { providerUUID, userUUID },
			update: { status: "PENDING", decidedAt: null },
			select: { status: true },
		});
	}

	async find(providerUUID: string, userUUID: string) {
		const request = await this.prisma.providerAccessRequest.findUnique({
			where: { providerUUID_userUUID: { providerUUID, userUUID } },
			select: { status: true },
		});
		if (!request) throw new NotFoundException("Access request not found");

		return request;
	}

	decide(providerUUID: string, userUUID: string, decision: Decision) {
		const key = { providerUUID_userUUID: { providerUUID, userUUID } };

		return this.prisma.$transaction(async (tx) => {
			const request = await tx.providerAccessRequest.findUnique({ where: key });
			if (!request) throw new NotFoundException("Access request not found");

			if (request.status !== "PENDING") {
				if (request.status === decision) return { status: request.status };
				throw new ConflictException("This access request has already been decided");
			}

			if (decision === "APPROVED") {
				await tx.providerUser.upsert({ where: key, create: { providerUUID, userUUID }, update: {} });
			}

			return tx.providerAccessRequest.update({
				where: key,
				data: { status: decision, decidedAt: new Date() },
				select: { status: true },
			});
		});
	}
}
