import { Controller, UseGuards } from "@nestjs/common";
import { tsRestHandler, TsRestHandler } from "@ts-rest/nest";
import { apiContract, meSchema } from "@flex/shared";
import { PublicApiKeyGuard } from "../core/guards/public-api-key.guard";
import { ApiUser } from "../core/decorators/api-user.decorator";
import { UsersService } from "../users/users.service";
import { PlaylistsService } from "../playlists/playlists.service";

@Controller()
@UseGuards(PublicApiKeyGuard)
export class ApiUserController {
	constructor(private readonly usersService: UsersService, private readonly playlistsService: PlaylistsService) {}

	@TsRestHandler(apiContract.me)
	public me(@ApiUser() apiUser: ApiUser) {
		return tsRestHandler(apiContract.me, async () => {
			const user = await this.usersService.getExposedInfoByUUID(apiUser.uuid, apiUser.uuid);
			return { status: 200, body: meSchema.parse(user) };
		});
	}
}
