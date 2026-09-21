import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { ProviderPermission } from "@flex/shared";
import { PERMISSION_KEY } from "../auth.constants";
import type { AuthenticatedRequest } from "../auth.types";

@Injectable()
export class PermissionGuard implements CanActivate {
	constructor(private readonly reflector: Reflector) {}

	canActivate(context: ExecutionContext) {
		const required = this.reflector.get<ProviderPermission>(PERMISSION_KEY, context.getHandler());
		const member = context.switchToHttp().getRequest<AuthenticatedRequest>().member!;

		if (!member.permissions.includes(required)) {
			throw new ForbiddenException({
				code: "INVALID_PERMISSION",
				message: `Missing permission ${required}`,
			});
		}
		return true;
	}
}
