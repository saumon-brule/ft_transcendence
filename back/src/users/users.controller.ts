import { Controller, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import {
	type AuthUser,
	CurrentUser,
} from "../core/decorators/current-user.decorator";
import {
	profileSchema,
	usersContract,
	rolesListDetailedResponseSchema,
	rolesListResponseSchema,
} from "@flex/shared";
import { tsRestHandler, TsRestHandler } from "@ts-rest/nest";
import { RequirePermission } from "../core/decorators/require-permission.decorator";
import { PERMISSIONS } from "@flex/shared";
import { JwtAuthGuardWithoutEmailVerif } from "../core/guards/jwt-auth.guard";

@Controller()
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@TsRestHandler(usersContract.profile)
	@UseGuards(JwtAuthGuardWithoutEmailVerif)
	public profile(@CurrentUser() authUser: AuthUser) {
		return tsRestHandler(usersContract.profile, async () => {
			const user = await this.usersService.getById(authUser.id);
			return { status: 200, body: profileSchema.parse(user) };
		});
	}

	@TsRestHandler(usersContract.getUserRoles)
	@RequirePermission(PERMISSIONS.MEMBERS.GET_ROLES)
	public getUserRoles() {
		return tsRestHandler(usersContract.getUserRoles, async ({ params }) => {
			const users = await this.usersService.getUserRoles(params.id);
			return { status: 200, body: rolesListResponseSchema.parse(users) };
		});
	}

	@TsRestHandler(usersContract.getUserRolesDetailed)
	@RequirePermission(PERMISSIONS.MEMBERS.GET_ROLES_DETAILED)
	public getUserRolesDetailed() {
		return tsRestHandler(usersContract.getUserRolesDetailed, async ({ params }) => {
			const user = await this.usersService.getUserRolesDetailed(params.id);
			return { status: 200, body: rolesListDetailedResponseSchema.parse(user) };
		});
	}

	@TsRestHandler(usersContract.addUserRole)
	@RequirePermission(PERMISSIONS.MEMBERS.CHANGE_ROLES)
	public addRoleToUser() {
		return tsRestHandler(
			usersContract.addUserRole,
			async ({ params, body }) => {
				await this.usersService.addRoleToUser(params.id, body.roleId);
				return { status: 204, body: null };
			},
		);
	}

	@TsRestHandler(usersContract.removeUserRole)
	@RequirePermission(PERMISSIONS.MEMBERS.CHANGE_ROLES)
	public removeRoleFromUser() {
		return tsRestHandler(
			usersContract.removeUserRole,
			async ({ params }) => {
				await this.usersService.removeRoleFromUser(
					params.id,
					params.roleId,
				);
				return { status: 204, body: null };
			},
		);
	}
}
