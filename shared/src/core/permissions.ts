export const PERMISSIONS = {
	MEMBERS: {
		MY_PROFILE: "users:my_profile",
		ANY_PROFILE: "users:any_profile",
		ALL_PROFILES: "users:all_profiles",
		GET_ROLES: "users:get_roles",
		GET_ROLES_DETAILED: "users:get_roles_detailed",
		CHANGE_ROLES: "users:change_roles",
	},
	ROLES: {
		CREATE: "roles:create",
		EDIT: "roles:edit",
		EDIT_PERMISSIONS: "roles:edit_permissions",
		DELETE: "roles:delete",
		DETAILS: "roles:details",
		LIST: "roles:list",
		LIST_DETAILED: "roles:list_detailed",
		LIST_MEMBERS: "roles:list_users",
	},
	PERMISSIONS: {
		LIST: "permissions:list",
	},
	APP_CONFIG: {
		LIST: "app-config:list",
		EDIT: "app-config:edit",
	},
} as const;

type PermissionValues<T> = T extends object
	? { [K in keyof T]: PermissionValues<T[K]> }[keyof T]
	: T;

export type Permission = PermissionValues<typeof PERMISSIONS>;

export const permissionValues = Object.values(PERMISSIONS).flatMap((group) => Object.values(group)) as [Permission, ...Permission[]];
