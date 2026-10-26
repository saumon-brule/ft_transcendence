import { Controller } from "@nestjs/common";
import { tsRestHandler, TsRestHandler } from "@ts-rest/nest";
import { providerContract } from "@flex/shared";
import { CurrentMember, RequirePermission } from "../core/auth/auth.decorators";
import type { MemberContext } from "../core/auth/auth.types";
import { RoleService } from "./role.service";

@Controller()
export class RoleController {
	constructor(private readonly roleService: RoleService) {}

	@TsRestHandler(providerContract.role.list)
	@RequirePermission("MANAGE_ROLES")
	list() {
		return tsRestHandler(providerContract.role.list, async () => ({
			status: 200,
			body: await this.roleService.list(),
		}));
	}

	@TsRestHandler(providerContract.role.create)
	@RequirePermission("MANAGE_ROLES")
	create(@CurrentMember() member: MemberContext) {
		return tsRestHandler(providerContract.role.create, async ({ body }) => ({
			status: 201,
			body: await this.roleService.create(body, member.uuid),
		}));
	}

	@TsRestHandler(providerContract.role.update)
	@RequirePermission("MANAGE_ROLES")
	update() {
		return tsRestHandler(providerContract.role.update, async ({ params, body }) => ({
			status: 200,
			body: await this.roleService.update(params.uuid, body),
		}));
	}

	@TsRestHandler(providerContract.role.remove)
	@RequirePermission("MANAGE_ROLES")
	remove() {
		return tsRestHandler(providerContract.role.remove, async ({ params }) => {
			await this.roleService.remove(params.uuid);
			return { status: 204, body: null };
		});
	}
}
