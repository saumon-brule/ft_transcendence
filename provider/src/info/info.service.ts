import { Injectable } from "@nestjs/common";
import { PrismaService } from "../core/prisma/prisma.service";

@Injectable()
export class InfoService {
	constructor(private readonly prisma: PrismaService) {}

	async get() {
		const provider = await this.prisma.provider.findUniqueOrThrow({ where: { id: 1 } });
		return { uuid: provider.uuid, visibility: provider.visibility };
	}
}
