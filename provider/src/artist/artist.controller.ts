import { Controller, Get, Param, ParseUUIDPipe, Query, Res, UploadedFile, UseInterceptors } from "@nestjs/common";
import { tsRestHandler, TsRestHandler } from "@ts-rest/nest";
import { MEDIA_ROUTES, providerContract } from "@flex/shared";
import type { Response } from "express";
import { CurrentMember, MemberOnly, RequirePermission } from "../core/auth/auth.decorators";
import type { MemberContext } from "../core/auth/auth.types";
import { DiscardFailedUploadInterceptor, ImageUploadInterceptor } from "../media/media.interceptor";
import { MediaService, type UploadedMedia } from "../media/media.service";
import { ArtistService } from "./artist.service";

@Controller()
export class ArtistController {
	constructor(
		private readonly artistService: ArtistService,
		private readonly media: MediaService,
	) {}

	@TsRestHandler(providerContract.artist.list)
	@MemberOnly()
	list() {
		return tsRestHandler(providerContract.artist.list, async ({ query }) => ({
			status: 200,
			body: await this.artistService.list(query),
		}));
	}

	@TsRestHandler(providerContract.artist.get)
	@MemberOnly()
	get() {
		return tsRestHandler(providerContract.artist.get, async ({ params }) => ({
			status: 200,
			body: await this.artistService.get(params.uuid),
		}));
	}

	@TsRestHandler(providerContract.artist.create)
	@RequirePermission("MANAGE_CATALOG")
	create(@CurrentMember() member: MemberContext) {
		return tsRestHandler(providerContract.artist.create, async ({ body }) => ({
			status: 201,
			body: await this.artistService.create(body, member.uuid),
		}));
	}

	@TsRestHandler(providerContract.artist.update)
	@RequirePermission("MANAGE_CATALOG")
	update() {
		return tsRestHandler(providerContract.artist.update, async ({ params, body }) => ({
			status: 200,
			body: await this.artistService.update(params.uuid, body),
		}));
	}

	@TsRestHandler(providerContract.artist.remove)
	@RequirePermission("MANAGE_CATALOG")
	remove() {
		return tsRestHandler(providerContract.artist.remove, async ({ params }) => {
			await this.artistService.remove(params.uuid);
			return { status: 204, body: null };
		});
	}

	@Get(MEDIA_ROUTES.artistAvatar)
	async avatarFile(
		@Param("uuid", ParseUUIDPipe) uuid: string,
		@Query("token") token: string,
		@Res() response: Response,
	) {
		await this.media.serve("artistAvatar", uuid, token, response);
	}

	@TsRestHandler(providerContract.artist.uploadAvatar)
	@RequirePermission("MANAGE_CATALOG")
	@UseInterceptors(DiscardFailedUploadInterceptor, ImageUploadInterceptor)
	uploadAvatar(@UploadedFile() file: UploadedMedia | undefined) {
		return tsRestHandler(providerContract.artist.uploadAvatar, async ({ params }) => {
			await this.media.save("artistAvatar", params.uuid, file);
			return { status: 204, body: null };
		});
	}

	@TsRestHandler(providerContract.artist.removeAvatar)
	@RequirePermission("MANAGE_CATALOG")
	removeAvatar() {
		return tsRestHandler(providerContract.artist.removeAvatar, async ({ params }) => {
			await this.media.clear("artistAvatar", params.uuid);
			return { status: 204, body: null };
		});
	}
}
