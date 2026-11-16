import { providerPermissions, type ProviderPermission } from "@flex/shared";

export const resolvePermissions = (isOwner: boolean, granted: ReadonlySet<string>): ProviderPermission[] => {
	const hasEverything = isOwner || granted.has("ADMIN");
	return providerPermissions.filter((permission) => hasEverything || granted.has(permission));
};
