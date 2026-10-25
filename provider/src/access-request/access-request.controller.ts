import { Controller } from "@nestjs/common";
import { tsRestHandler, TsRestHandler } from "@ts-rest/nest";
import { providerContract } from "@flex/shared";
import { Authenticated, CurrentMember, CurrentUser, MemberOnly, RequirePermission } from "../core/auth/auth.decorators";
import type { CurrentUserData, MemberContext } from "../core/auth/auth.types";
import { AccessRequestService } from "./access-request.service";

@Controller()
export class AccessRequestController {
	constructor(private readonly accessRequestService: AccessRequestService) {}

	@TsRestHandler(providerContract.accessRequest.create)
	@Authenticated()
	create() {
		return tsRestHandler(providerContract.accessRequest.create, async ({ body }) => ({
			status: 201,
			body: await this.accessRequestService.create(body.token),
		}));
	}

	@TsRestHandler(providerContract.accessRequest.me)
	@MemberOnly()
	getMine(@CurrentUser() user: CurrentUserData) {
		return tsRestHandler(providerContract.accessRequest.me, async () => ({
			status: 200,
			body: await this.accessRequestService.getMine(user.userUuid),
		}));
	}

	@TsRestHandler(providerContract.accessRequest.list)
	@RequirePermission("MANAGE_MEMBERS")
	list() {
		return tsRestHandler(providerContract.accessRequest.list, async ({ query }) => ({
			status: 200,
			body: await this.accessRequestService.list(query),
		}));
	}

	@TsRestHandler(providerContract.accessRequest.decide)
	@RequirePermission("MANAGE_MEMBERS")
	decide(@CurrentMember() member: MemberContext) {
		return tsRestHandler(providerContract.accessRequest.decide, async ({ params, body }) => ({
			status: 200,
			body: await this.accessRequestService.decide(params.uuid, body.decision, member.uuid),
		}));
	}
}
