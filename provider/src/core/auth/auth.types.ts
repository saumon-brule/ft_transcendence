import type { Request } from "express";
import type { ProviderPermission, ProviderTokenScope } from "@flex/shared";

export interface CurrentUserData {
	userUuid: string;
	scope: ProviderTokenScope;
}

export interface MemberContext {
	uuid: string;
	isOwner: boolean;
	permissions: ProviderPermission[];
	roles: { uuid: string; name: string }[];
}

export interface AuthenticatedRequest extends Request {
	auth?: CurrentUserData;
	member?: MemberContext;
}
