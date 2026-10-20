import {
	Controller,
	UseGuards,
} from "@nestjs/common";

import { tsRestHandler, TsRestHandler } from "@ts-rest/nest";
import { FriendsService } from "./friends.service";
import { friendsContract } from "@flex/shared";
import { JwtAuthGuard } from "../../core/guards/jwt-auth.guard";
import { AuthUser, CurrentUser } from "../../core/decorators/current-user.decorator";

@Controller()
export class FriendsController {
	constructor(private readonly friendsService: FriendsService) {}

	@TsRestHandler(friendsContract.getFriends)
	@UseGuards(JwtAuthGuard)
	public getFriends(@CurrentUser() authuser: AuthUser) {
		return tsRestHandler(friendsContract.getFriends, async () => {
			const friends = await this.friendsService.getFriends(authuser.uuid);
			return { status: 200, body: friends };
		});
	}

	@TsRestHandler(friendsContract.isFriendWith)
	@UseGuards(JwtAuthGuard)
	public isFriendWith() {
		return tsRestHandler(friendsContract.isFriendWith, async ({ query }) => {
			const isFriend = await this.friendsService.isFriendWith(
				query.userUuid1,
				query.userUuid2,
			);
			return {
				status: 200,
				body: { isFriend },
			};
		});
	}

	@TsRestHandler(friendsContract.makeRequest)
	@UseGuards(JwtAuthGuard)
	public makeRequest(@CurrentUser() authuser: AuthUser) {
		return tsRestHandler(friendsContract.makeRequest, async ({ body }) => {
			await this.friendsService.makeRequest(authuser.uuid, body.targetUuid);
			return { status: 204, body: null };
		});
	}

	@TsRestHandler(friendsContract.removeFriend)
	@UseGuards(JwtAuthGuard)
	public removeFriend(@CurrentUser() authuser: AuthUser) {
		return tsRestHandler(friendsContract.removeFriend, async ({ params }) => {
			await this.friendsService.removeFriend(authuser.uuid, params.friendUuid);
			return { status: 204, body: null };
		});
	}

	@TsRestHandler(friendsContract.manageRequests)
	@UseGuards(JwtAuthGuard)
	public manageRequests(@CurrentUser() authUser: AuthUser) {
		return tsRestHandler(friendsContract.manageRequests, async ({ params, body }) => {
			await this.friendsService.manageRequests(
				params.requesterUuid,
				authUser.uuid,
				body.status,
			);
			return { status: 204, body: null };
		});
	}
}
