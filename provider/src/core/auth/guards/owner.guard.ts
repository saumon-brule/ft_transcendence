import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { AuthenticatedRequest } from "../auth.types";
import { AppForbiddenException } from "../../error/forbidden";

@Injectable()
export class OwnerGuard implements CanActivate {
	canActivate(context: ExecutionContext) {
		const member = context.switchToHttp().getRequest<AuthenticatedRequest>().member!;

		if (!member.isOwner) {
			throw new AppForbiddenException("INVALID_PERMISSION", "Only the owner can do this");
		}
		return true;
	}
}
