import { Controller, Req } from "@nestjs/common";
import { tsRestHandler, TsRestHandler } from "@ts-rest/nest";
import { providerContract } from "@flex/shared";
import type { Request } from "express";
import { CurrentMember, MemberOnly, RequirePermission } from "../core/auth/auth.decorators";
import type { MemberContext } from "../core/auth/auth.types";
import { MusicService } from "./music.service";

@Controller()
export class MusicController {
	constructor(private readonly musicService: MusicService) {}

	@TsRestHandler(providerContract.music.list)
	@MemberOnly()
	list() {
		return tsRestHandler(providerContract.music.list, async ({ query }) => ({
			status: 200,
			body: await this.musicService.list(query),
		}));
	}

	@TsRestHandler(providerContract.music.get)
	@MemberOnly()
	get() {
		return tsRestHandler(providerContract.music.get, async ({ params }) => ({
			status: 200,
			body: await this.musicService.get(params.uuid),
		}));
	}

	@TsRestHandler(providerContract.music.create)
	@RequirePermission("MANAGE_CATALOG")
	create(@CurrentMember() member: MemberContext) {
		return tsRestHandler(providerContract.music.create, async ({ body }) => ({
			status: 201,
			body: await this.musicService.create(body, member.id),
		}));
	}

	@TsRestHandler(providerContract.music.update)
	@RequirePermission("MANAGE_CATALOG")
	update() {
		return tsRestHandler(providerContract.music.update, async ({ params, body }) => ({
			status: 200,
			body: await this.musicService.update(params.uuid, body),
		}));
	}

	@TsRestHandler(providerContract.music.remove)
	@RequirePermission("MANAGE_CATALOG")
	remove() {
		return tsRestHandler(providerContract.music.remove, async ({ params }) => {
			await this.musicService.remove(params.uuid);
			return { status: 204, body: null };
		});
	}

	@TsRestHandler(providerContract.music.streamUrl)
	@MemberOnly()
	streamUrl(@CurrentMember() member: MemberContext, @Req() request: Request) {
		const origin = `${request.protocol}://${request.get("host")}`;

		return tsRestHandler(providerContract.music.streamUrl, async ({ params }) => ({
			status: 200,
			body: await this.musicService.streamUrl(params.uuid, member.uuid, origin),
		}));
	}
}
