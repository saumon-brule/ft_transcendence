import { Controller } from "@nestjs/common";
import { tsRestHandler, TsRestHandler } from "@ts-rest/nest";
import { providerContract } from "@flex/shared";
import { CurrentMember, MemberOnly, RequirePermission } from "../core/auth/auth.decorators";
import type { MemberContext } from "../core/auth/auth.types";
import { AlbumsService } from "./albums.service";

@Controller()
export class AlbumsController {
	constructor(private readonly albumsService: AlbumsService) {}

	@TsRestHandler(providerContract.album.list)
	@MemberOnly()
	list() {
		return tsRestHandler(providerContract.album.list, async ({ query }) => ({
			status: 200,
			body: await this.albumsService.list(query),
		}));
	}

	@TsRestHandler(providerContract.album.get)
	@MemberOnly()
	get() {
		return tsRestHandler(providerContract.album.get, async ({ params }) => ({
			status: 200,
			body: await this.albumsService.get(params.uuid),
		}));
	}

	@TsRestHandler(providerContract.album.create)
	@RequirePermission("MANAGE_CATALOG")
	create(@CurrentMember() member: MemberContext) {
		return tsRestHandler(providerContract.album.create, async ({ body }) => ({
			status: 201,
			body: await this.albumsService.create(body, member.id),
		}));
	}

	@TsRestHandler(providerContract.album.update)
	@RequirePermission("MANAGE_CATALOG")
	update() {
		return tsRestHandler(providerContract.album.update, async ({ params, body }) => ({
			status: 200,
			body: await this.albumsService.update(params.uuid, body),
		}));
	}

	@TsRestHandler(providerContract.album.remove)
	@RequirePermission("MANAGE_CATALOG")
	remove() {
		return tsRestHandler(providerContract.album.remove, async ({ params }) => {
			await this.albumsService.remove(params.uuid);
			return { status: 204, body: null };
		});
	}
}
