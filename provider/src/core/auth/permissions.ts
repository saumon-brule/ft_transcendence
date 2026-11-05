import { providerPermissions, type ProviderPermission } from "@flex/shared";

export const resolvePermissions = (isOwner: boolean, granted: ReadonlySet<string>): ProviderPermission[] => providerPermissions.filter(
	(permission) => isOwner || granted.has(permission),
);
