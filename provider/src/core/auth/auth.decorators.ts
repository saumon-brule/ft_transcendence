import { applyDecorators, createParamDecorator, ExecutionContext, SetMetadata, UseGuards } from "@nestjs/common";
import type { ProviderPermission } from "@flex/shared";
import { PERMISSION_KEY } from "./auth.constants";
import { MemberGuard } from "./guards/member.guard";
import { OwnerGuard } from "./guards/owner.guard";
import { PermissionGuard } from "./guards/permission.guard";
import { TokenGuard } from "./guards/token.guard";
import type { AuthenticatedRequest } from "./auth.types";

export const Authenticated = () => UseGuards(TokenGuard);

export const MemberOnly = () => UseGuards(TokenGuard, MemberGuard);

export const OwnerOnly = () => UseGuards(TokenGuard, MemberGuard, OwnerGuard);

export const RequirePermission = (permission: ProviderPermission) =>
	applyDecorators(
		SetMetadata(PERMISSION_KEY, permission),
		UseGuards(TokenGuard, MemberGuard, PermissionGuard),
	);

export const CurrentUser = createParamDecorator(
	(_data: unknown, context: ExecutionContext) =>
		context.switchToHttp().getRequest<AuthenticatedRequest>().auth!,
);

export const CurrentMember = createParamDecorator(
	(_data: unknown, context: ExecutionContext) =>
		context.switchToHttp().getRequest<AuthenticatedRequest>().member!,
);
