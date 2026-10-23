import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { CreateProviderDto, ProviderTokenScope } from "@flex/shared";
import { Prisma } from "../generated/prisma/client";
import { LogBuilder } from "../core/logging/log-builder";
import { WinstonLoggerService } from "../core/logging/logger.service";
import { PrismaService } from "../core/prisma/prisma.service";
import { generateApiKey } from "../providersAPI/providersAPIKey";
import { ProviderSigningKeyService } from "../providersAPI/providersSigningKey.service";

function normalizeAddress(address: string) {
	const url = new URL(address);
	return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
}

@Injectable()
export class ProvidersService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly logger: WinstonLoggerService,
		private readonly signingKey: ProviderSigningKeyService,
	) {}

	async create(ownerUUID: string, dto: CreateProviderDto) {
		const uuid = randomUUID();
		const { key, keyHash } = generateApiKey(uuid);

		try {
			const provider = await this.prisma.provider.create({
				data: {
					uuid,
					name: dto.name,
					address: normalizeAddress(dto.address),
					publicDisplay: dto.publicDisplay,
					owner: { connect: { uuid: ownerUUID } },
					hashedKey: keyHash,
					users: {
						create: {
							publicDisplay: dto.publicDisplay,
							user: { connect: { uuid: ownerUUID } },
						},
					},
				},
				select: { uuid: true, name: true, address: true, publicDisplay: true },
			});

			this.logger.log(LogBuilder.provider.created(provider.uuid, ownerUUID));
			return { ...provider, apiKey: key };
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
				throw new ConflictException("A provider with this name or address already exists");
			}
			throw error;
		}
	}

	async edit(ownerUUID: string, uuid: string, dto: Partial<CreateProviderDto>) {
		const provider = await this.prisma.provider.findUnique({ where: { uuid, ownerUUID: ownerUUID } });

		if (!provider) {
			throw new NotFoundException("Provider not found or you do not have permission to edit it");
		}

		const updatedProvider = await this.prisma.provider.update({
			where: { uuid: provider.uuid },
			data: {
				name: dto.name ?? provider.name,
				address: dto.address
					? normalizeAddress(dto.address)
					: provider.address,
				publicDisplay: dto.publicDisplay ?? provider.publicDisplay,
			},
			select: { uuid: true, name: true, address: true, publicDisplay: true },
		});

		return updatedProvider;
	}

	async delete(ownerUUID: string, uuid: string) {
		const provider = await this.prisma.provider.findUnique({ where: { uuid, ownerUUID: ownerUUID } });

		if (!provider) {
			throw new NotFoundException("Provider not found or you do not have permission to delete it");
		}

		await this.prisma.provider.delete({ where: { uuid: provider.uuid } });
	}

	async regenerateKey(ownerUUID: string, uuid: string) {
		const provider = await this.prisma.provider.findUnique({ where: { uuid, ownerUUID: ownerUUID } });

		if (!provider) {
			throw new NotFoundException("Provider not found or you do not have permission to edit it");
		}

		const { key, keyHash } = generateApiKey(provider.uuid);

		await this.prisma.provider.update({
			where: { uuid: provider.uuid },
			data: { hashedKey: keyHash },
		});

		return { apiKey: key };
	}

	issueAccessToken(userUUID: string, uuid: string) {
		return this.issueToken(userUUID, uuid, "access");
	}

	issueRequestAccessToken(userUUID: string, uuid: string) {
		return this.issueToken(userUUID, uuid, "request-access");
	}

	private async issueToken(userUUID: string, uuid: string, scope: ProviderTokenScope) {
		const provider = await this.prisma.provider.findUnique({ where: { uuid }, select: { uuid: true } });

		if (!provider) {
			throw new NotFoundException("Provider not found");
		}

		return this.signingKey.signUserToken(userUUID, provider.uuid, scope);
	}
}
