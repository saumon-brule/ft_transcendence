import { Controller } from "@nestjs/common";
import { tsRestHandler, TsRestHandler } from "@ts-rest/nest";
import { providerContract } from "@flex/shared";
import { CurrentMember, RequirePermission } from "../core/auth/auth.decorators";
import type { MemberContext } from "../core/auth/auth.types";
import { RolesService } from "./roles.service";

@Controller()
export class RolesController {
	constructor(private readonly rolesService: RolesService) {}

	@TsRestHandler(providerContract.roles.list)
	@RequirePermission("MANAGE_ROLES")
	list() {
		return tsRestHandler(providerContract.roles.list, async () => ({
			status: 200,
			body: await this.rolesService.list(),
		}));
	}

	@TsRestHandler(providerContract.roles.create)
	@RequirePermission("MANAGE_ROLES")
	create(@CurrentMember() member: MemberContext) {
		return tsRestHandler(providerContract.roles.create, async ({ body }) => ({
			status: 201,
			body: await this.rolesService.create(body, member.uuid),
		}));
	}

	@TsRestHandler(providerContract.roles.update)
	@RequirePermission("MANAGE_ROLES")
	update() {
		return tsRestHandler(providerContract.roles.update, async ({ params, body }) => ({
			status: 200,
			body: await this.rolesService.update(params.uuid, body),
		}));
	}

	@TsRestHandler(providerContract.roles.remove)
	@RequirePermission("MANAGE_ROLES")
	remove() {
		return tsRestHandler(providerContract.roles.remove, async ({ params }) => {
			await this.rolesService.remove(params.uuid);
			return { status: 204, body: null };
		});
	}
}
