import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { providerPermissions } from "@flex/shared";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthenticatedRequest } from "../auth.types";

@Injectable()
export class MemberGuard implements CanActivate {
	constructor(private readonly prisma: PrismaService) {}

	async canActivate(context: ExecutionContext) {
		const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
		const userUuid = request.auth!.userUuid;

		const member = await this.prisma.member.findUnique({
			where: { uuid: userUuid },
			include: { roles: { include: { role: { include: { permissions: true } } } } },
		});

		if (!member) {
			throw new ForbiddenException({
				code: "NOT_A_MEMBER",
				message: "You are not a member of this provider",
			});
		}
		if (member.revokedAt) {
			throw new ForbiddenException({
				code: "MEMBER_REVOKED",
				message: "Your access to this provider has been revoked",
			});
		}

		const { ownerId } = await this.prisma.provider.findUniqueOrThrow({
			where: { id: 1 },
			select: { ownerId: true },
		});
		const isOwner = ownerId === member.id;
		const granted = new Set(member.roles.flatMap((r) => r.role.permissions.map((p) => p.permission)));

		request.member = {
			id: member.id,
			uuid: member.uuid,
			isOwner,
			permissions: providerPermissions.filter((p) => isOwner || granted.has(p)),
			roles: member.roles.map((r) => ({ uuid: r.role.uuid, name: r.role.name })),
		};
		return true;
	}
}
