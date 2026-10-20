import { Controller } from "@nestjs/common";
import { tsRestHandler, TsRestHandler } from "@ts-rest/nest";
import { providerContract } from "@flex/shared";
import { CurrentMember, MemberOnly, RequirePermission } from "../core/auth/auth.decorators";
import type { MemberContext } from "../core/auth/auth.types";
import { MembersService } from "./members.service";

@Controller()
export class MembersController {
	constructor(private readonly membersService: MembersService) {}

	@TsRestHandler(providerContract.members.me)
	@MemberOnly()
	me(@CurrentMember() member: MemberContext) {
		return tsRestHandler(providerContract.members.me, () => Promise.resolve({
			status: 200 as const,
			body: this.membersService.me(member),
		}));
	}

	@TsRestHandler(providerContract.members.list)
	@RequirePermission("MANAGE_MEMBERS")
	list() {
		return tsRestHandler(providerContract.members.list, async ({ query }) => ({
			status: 200,
			body: await this.membersService.list(query),
		}));
	}

	@TsRestHandler(providerContract.members.revoke)
	@RequirePermission("MANAGE_MEMBERS")
	revoke(@CurrentMember() member: MemberContext) {
		return tsRestHandler(providerContract.members.revoke, async ({ params }) => {
			await this.membersService.revoke(params.uuid, member.uuid);
			return { status: 204, body: null };
		});
	}

	@TsRestHandler(providerContract.members.setRoles)
	@RequirePermission("MANAGE_ROLES")
	setRoles() {
		return tsRestHandler(providerContract.members.setRoles, async ({ params, body }) => ({
			status: 200,
			body: await this.membersService.setRoles(params.uuid, body.roleUuids),
		}));
	}
}
