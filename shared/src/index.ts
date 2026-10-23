export { appContract, appContract as serverContract } from "./contracts/server/server.contract";
export { authContract } from "./contracts/server/auth/auth.contract";
export { usersContract } from "./contracts/server/users/users.contract";
export { rolesContract } from "./contracts/server/roles/roles.contract";
export { permissionsContract } from "./contracts/server/permissions/permissions.contract";
export { appConfigContract } from "./contracts/server/appConfig/app-config.contract";
export { playlistsContract } from "./contracts/server/playlists/playlists.contract";
export { providerContract } from "./contracts/provider/provider.contract";
export { friendsContract } from "./contracts/server/users/friends.contract";
export { type FriendRelation, type FriendRequestAnswer } from "./contracts/server/users/schemas/friends.schema";

export { loginSchema, type LoginDto } from "./contracts/server/auth/schemas/login.schema";
export { requestEmailResetSchema, resetEmailSchema, type RequestEmailResetDto, type ResetEmailDto } from "./contracts/server/auth/schemas/email.schema";
export { registerSchema, type RegisterDto } from "./contracts/server/auth/schemas/register.schema";
export { resetPasswordSchema, changePasswordSchema, type RequestPasswordResetDto, type ChangePasswordDto } from "./contracts/server/auth/schemas/password.schema";
export { userSchema, meSchema, updateMeSchema, type User, type ShortUser, type Profile, type UpdateMeDto } from "./contracts/server/users/schemas/user.schema";
export { createProviderSchema, editProviderSchema, type CreateProviderDto, type Provider } from "./contracts/server/providers/schemas/provider.schema";
export { createRoleSchema, roleUsersResponseSchema, roleResponseSchema, rolesListDetailedResponseSchema, rolesListResponseSchema } from "./contracts/server/roles/schemas/role.schema";
export { getAppVariables } from "./contracts/server/appConfig/schemas/app-config.schema";

export { emailConfirmationPath, passwordResetConfirmationPath, ftIntraAuthCallbackPath, ftIntraLinkCallbackPath, changeEmailConfirmationPath } from "./core/constants";
export { createJwtPayload, type JwtPayload } from "./core/jwt.payload";
export { PERMISSIONS } from "./core/permissions";
export { type Permission } from "./core/permissions";

export { providerPermissions, providerPermissionSchema, type ProviderPermission } from "./contracts/provider/roles/schemas/role.schema";

export * from "./errors/error-codes";
export * from "./errors/error-schemas";
export { buildErrorResponse, type BuiltError, type ErrorBody } from "./errors/build-error-response";

export { type HealthResponseDto } from "./contracts/provider/info/schemas/info.schema";
