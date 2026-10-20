import { Controller } from "@nestjs/common";
import { tsRestHandler, TsRestHandler } from "@ts-rest/nest";
import { providerContract } from "@flex/shared";
import { Authenticated, CurrentMember, CurrentUser, RequirePermission } from "../core/auth/auth.decorators";
import type { CurrentUserData, MemberContext } from "../core/auth/auth.types";
import { AccessRequestsService } from "./access-requests.service";

@Controller()
export class AccessRequestsController {
	constructor(private readonly accessRequestsService: AccessRequestsService) {}

	@TsRestHandler(providerContract.accessRequests.create)
	@Authenticated()
	create(@CurrentUser() user: CurrentUserData) {
		return tsRestHandler(providerContract.accessRequests.create, async () => ({
			status: 201,
			body: await this.accessRequestsService.create(user.userUuid),
		}));
	}

	@TsRestHandler(providerContract.accessRequests.me)
	@Authenticated()
	getMine(@CurrentUser() user: CurrentUserData) {
		return tsRestHandler(providerContract.accessRequests.me, async () => ({
			status: 200,
			body: await this.accessRequestsService.getMine(user.userUuid),
		}));
	}

	@TsRestHandler(providerContract.accessRequests.list)
	@RequirePermission("MANAGE_MEMBERS")
	list() {
		return tsRestHandler(providerContract.accessRequests.list, async ({ query }) => ({
			status: 200,
			body: await this.accessRequestsService.list(query),
		}));
	}

	@TsRestHandler(providerContract.accessRequests.decide)
	@RequirePermission("MANAGE_MEMBERS")
	decide(@CurrentMember() member: MemberContext) {
		return tsRestHandler(providerContract.accessRequests.decide, async ({ params, body }) => ({
			status: 200,
			body: await this.accessRequestsService.decide(params.uuid, body.decision, member.id),
		}));
	}
}
