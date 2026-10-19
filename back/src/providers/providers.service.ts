import { ConflictException, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { CreateProviderDto } from "@flex/shared";
import { Prisma } from "../generated/prisma/client";
import { LogBuilder } from "../core/logging/log-builder";
import { WinstonLoggerService } from "../core/logging/logger.service";
import { PrismaService } from "../core/prisma/prisma.service";
import { generateApiKey } from "../providersAPI/providerAPIKey";

function normalizeAddress(address: string) {
	const url = new URL(address);
	return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
}

@Injectable()
export class ProvidersService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly logger: WinstonLoggerService,
	) {}

	async create(ownerUuid: string, dto: CreateProviderDto) {
		const uuid = randomUUID();
		const { key, keyHash } = generateApiKey(uuid);

		try {
			const provider = await this.prisma.provider.create({
				data: {
					uuid,
					name: dto.name,
					adress: normalizeAddress(dto.adress),
					publicDisplay: dto.publicDisplay,
					owner: { connect: { uuid: ownerUuid } },
					hashedKey: keyHash,
					users: {
						create: {
							publicDisplay: dto.publicDisplay,
							user: { connect: { uuid: ownerUuid } },
						},
					},
				},
				select: { uuid: true, name: true, adress: true, publicDisplay: true },
			});

			this.logger.log(LogBuilder.provider.created(provider.uuid, ownerUuid));
			return { ...provider, apiKey: key };
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
				throw new ConflictException("A provider with this name or address already exists");
			}
			throw error;
		}
	}
}
