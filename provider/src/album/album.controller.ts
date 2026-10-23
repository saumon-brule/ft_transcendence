import { Controller, Get, Param, ParseUUIDPipe, Query, Res, UploadedFile, UseInterceptors } from "@nestjs/common";
import { tsRestHandler, TsRestHandler } from "@ts-rest/nest";
import { MEDIA_ROUTES, providerContract } from "@flex/shared";
import type { Response } from "express";
import { CurrentMember, MemberOnly, RequirePermission } from "../core/auth/auth.decorators";
import type { MemberContext } from "../core/auth/auth.types";
import { DiscardFailedUploadInterceptor, ImageUploadInterceptor } from "../media/media.interceptor";
import { MediaService, type UploadedMedia } from "../media/media.service";
import { AlbumService } from "./album.service";

@Controller()
export class AlbumController {
	constructor(
		private readonly albumService: AlbumService,
		private readonly media: MediaService,
	) {}

	@TsRestHandler(providerContract.album.list)
	@MemberOnly()
	list() {
		return tsRestHandler(providerContract.album.list, async ({ query }) => ({
			status: 200,
			body: await this.albumService.list(query),
		}));
	}

	@TsRestHandler(providerContract.album.get)
	@MemberOnly()
	get() {
		return tsRestHandler(providerContract.album.get, async ({ params }) => ({
			status: 200,
			body: await this.albumService.get(params.uuid),
		}));
	}

	@TsRestHandler(providerContract.album.create)
	@RequirePermission("MANAGE_CATALOG")
	create(@CurrentMember() member: MemberContext) {
		return tsRestHandler(providerContract.album.create, async ({ body }) => ({
			status: 201,
			body: await this.albumService.create(body, member.uuid),
		}));
	}

	@TsRestHandler(providerContract.album.update)
	@RequirePermission("MANAGE_CATALOG")
	update() {
		return tsRestHandler(providerContract.album.update, async ({ params, body }) => ({
			status: 200,
			body: await this.albumService.update(params.uuid, body),
		}));
	}

	@TsRestHandler(providerContract.album.remove)
	@RequirePermission("MANAGE_CATALOG")
	remove() {
		return tsRestHandler(providerContract.album.remove, async ({ params }) => {
			await this.albumService.remove(params.uuid);
			return { status: 204, body: null };
		});
	}

	@Get(MEDIA_ROUTES.albumCover)
	async coverFile(
		@Param("uuid", ParseUUIDPipe) uuid: string,
		@Query("token") token: string,
		@Res() response: Response,
	) {
		await this.media.serve("albumCover", uuid, token, response);
	}

	@TsRestHandler(providerContract.album.uploadCover)
	@RequirePermission("MANAGE_CATALOG")
	@UseInterceptors(DiscardFailedUploadInterceptor, ImageUploadInterceptor)
	uploadCover(@UploadedFile() file: UploadedMedia | undefined) {
		return tsRestHandler(providerContract.album.uploadCover, async ({ params }) => {
			await this.media.save("albumCover", params.uuid, file);
			return { status: 204, body: null };
		});
	}

	@TsRestHandler(providerContract.album.removeCover)
	@RequirePermission("MANAGE_CATALOG")
	removeCover() {
		return tsRestHandler(providerContract.album.removeCover, async ({ params }) => {
			await this.media.clear("albumCover", params.uuid);
			return { status: 204, body: null };
		});
	}
}
