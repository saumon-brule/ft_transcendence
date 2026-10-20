import type { Request } from "express";
import type { ProviderPermission } from "@flex/shared";

export interface CurrentUserData {
	userUuid: string;
}

export interface MemberContext {
	id: number;
	uuid: string;
	isOwner: boolean;
	permissions: ProviderPermission[];
	roles: { uuid: string; name: string }[];
}

export interface AuthenticatedRequest extends Request {
	auth?: CurrentUserData;
	member?: MemberContext;
}
