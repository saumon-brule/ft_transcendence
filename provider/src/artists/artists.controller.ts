import { Controller } from "@nestjs/common";
import { tsRestHandler, TsRestHandler } from "@ts-rest/nest";
import { providerContract } from "@flex/shared";
import { CurrentMember, MemberOnly, RequirePermission } from "../core/auth/auth.decorators";
import type { MemberContext } from "../core/auth/auth.types";
import { ArtistsService } from "./artists.service";

@Controller()
export class ArtistsController {
	constructor(private readonly artistsService: ArtistsService) {}

	@TsRestHandler(providerContract.artist.list)
	@MemberOnly()
	list() {
		return tsRestHandler(providerContract.artist.list, async ({ query }) => ({
			status: 200,
			body: await this.artistsService.list(query),
		}));
	}

	@TsRestHandler(providerContract.artist.get)
	@MemberOnly()
	get() {
		return tsRestHandler(providerContract.artist.get, async ({ params }) => ({
			status: 200,
			body: await this.artistsService.get(params.uuid),
		}));
	}

	@TsRestHandler(providerContract.artist.create)
	@RequirePermission("MANAGE_CATALOG")
	create(@CurrentMember() member: MemberContext) {
		return tsRestHandler(providerContract.artist.create, async ({ body }) => ({
			status: 201,
			body: await this.artistsService.create(body, member.id),
		}));
	}

	@TsRestHandler(providerContract.artist.update)
	@RequirePermission("MANAGE_CATALOG")
	update() {
		return tsRestHandler(providerContract.artist.update, async ({ params, body }) => ({
			status: 200,
			body: await this.artistsService.update(params.uuid, body),
		}));
	}

	@TsRestHandler(providerContract.artist.remove)
	@RequirePermission("MANAGE_CATALOG")
	remove() {
		return tsRestHandler(providerContract.artist.remove, async ({ params }) => {
			await this.artistsService.remove(params.uuid);
			return { status: 204, body: null };
		});
	}
}
