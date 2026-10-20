import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { ProviderPermission } from "@flex/shared";
import { PERMISSION_KEY } from "../auth.constants";
import type { AuthenticatedRequest } from "../auth.types";
import { AppForbiddenException } from "../../error/forbidden";

@Injectable()
export class PermissionGuard implements CanActivate {
	constructor(private readonly reflector: Reflector) {}

	canActivate(context: ExecutionContext) {
		const required = this.reflector.get<ProviderPermission>(PERMISSION_KEY, context.getHandler());
		const member = context.switchToHttp().getRequest<AuthenticatedRequest>().member!;

		if (!member.permissions.includes(required)) {
			throw new AppForbiddenException("INVALID_PERMISSION", `Missing permission ${required}`);
		}
		return true;
	}
}
