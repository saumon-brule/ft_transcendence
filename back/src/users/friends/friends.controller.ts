import {
	Controller,
	UseGuards,
} from "@nestjs/common";

import { tsRestHandler, TsRestHandler } from "@ts-rest/nest";
import { UsersService } from "../users.service";
import { FriendsService } from "./friends.service";
import { friendsContract } from "@flex/shared";
import { JwtAuthGuard } from "../../core/guards/jwt-auth.guard";
import { AuthUser, CurrentUser } from "../../core/decorators/current-user.decorator";

@Controller()
export class FriendsController {
	constructor(
		private readonly friendsService: FriendsService,
		private readonly usersService: UsersService,
	) {}

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
			const requester = await this.usersService.getByUUID(authuser.uuid);
			const target = await this.usersService.getByUUID(body.targetUuid);
			await this.friendsService.makeRequest(requester.id, target.id);
			return { status: 204, body: null };
		});
	}

	@TsRestHandler(friendsContract.removeFriend)
	@UseGuards(JwtAuthGuard)
	public removeFriend(@CurrentUser() authuser: AuthUser) {
		return tsRestHandler(friendsContract.removeFriend, async ({ params }) => {
			const user = await this.usersService.getByUUID(authuser.uuid);
			const friend = await this.usersService.getByUUID(params.friendUuid);
			await this.friendsService.removeFriend(user.id, friend.id);
			return { status: 204, body: null };
		});
	}

	@TsRestHandler(friendsContract.manageRequests)
	@UseGuards(JwtAuthGuard)
	public manageRequests(@CurrentUser() authUser: AuthUser) {
		return tsRestHandler(friendsContract.manageRequests, async ({ params, body }) => {
			const requester = await this.usersService.getByUUID(params.requesterUuid);
			const recipient = await this.usersService.getByUUID(authUser.uuid);
			await this.friendsService.manageRequests(
				requester.id,
				recipient.id,
				body.status,
			);
			return { status: 204, body: null };
		});
	}
}
