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
	) { }

	@TsRestHandler(friendsContract.getStatus)
	public getStatus() {
		return tsRestHandler(friendsContract.getStatus, async ({ query }) => {
			const status = await this.friendsService.getStatus(query.userId, query.friendId);
			return { status: 200, body: { status: status } };
		});
	}

	@TsRestHandler(friendsContract.getFriends)
	@UseGuards(JwtAuthGuard)
	public getFriends(@CurrentUser() authuser: AuthUser) {
		return tsRestHandler(friendsContract.getFriends, async () => {
			const friends = await this.friendsService.getFriends(authuser.uuid);
			return { status: 200, body: friends };
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

	// @TsRestHandler(friendsContract.removeFriend)
	// @UseGuards(JwtAuthGuard)
	// public removeFriend(@CurrentUser() authuser: AuthUser) {}

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
