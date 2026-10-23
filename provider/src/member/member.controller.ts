import { Controller } from "@nestjs/common";
import { tsRestHandler, TsRestHandler } from "@ts-rest/nest";
import { providerContract } from "@flex/shared";
import { CurrentMember, MemberOnly, RequirePermission } from "../core/auth/auth.decorators";
import type { MemberContext } from "../core/auth/auth.types";
import { MemberService } from "./member.service";

@Controller()
export class MemberController {
	constructor(private readonly memberService: MemberService) {}

	@TsRestHandler(providerContract.member.me)
	@MemberOnly()
	me(@CurrentMember() member: MemberContext) {
		return tsRestHandler(providerContract.member.me, () => Promise.resolve({
			status: 200 as const,
			body: this.memberService.me(member),
		}));
	}

	@TsRestHandler(providerContract.member.list)
	@RequirePermission("MANAGE_MEMBERS")
	list() {
		return tsRestHandler(providerContract.member.list, async ({ query }) => ({
			status: 200,
			body: await this.memberService.list(query),
		}));
	}

	@TsRestHandler(providerContract.member.revoke)
	@RequirePermission("MANAGE_MEMBERS")
	revoke(@CurrentMember() member: MemberContext) {
		return tsRestHandler(providerContract.member.revoke, async ({ params }) => {
			await this.memberService.revoke(params.uuid, member.uuid);
			return { status: 204, body: null };
		});
	}

	@TsRestHandler(providerContract.member.setRoles)
	@RequirePermission("MANAGE_ROLES")
	setRoles() {
		return tsRestHandler(providerContract.member.setRoles, async ({ params, body }) => ({
			status: 200,
			body: await this.memberService.setRoles(params.uuid, body.roleUuids),
		}));
	}
}
