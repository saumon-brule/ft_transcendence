import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import type { AuthenticatedRequest } from "../auth.types";

@Injectable()
export class OwnerGuard implements CanActivate {
	canActivate(context: ExecutionContext) {
		const member = context.switchToHttp().getRequest<AuthenticatedRequest>().member!;

		if (!member.isOwner) {
			throw new ForbiddenException({
				code: "INVALID_PERMISSION",
				message: "Only the owner can do this",
			});
		}
		return true;
	}
}
