import { Controller, Get, Param, ParseUUIDPipe, Query, Res, UploadedFile, UseInterceptors } from "@nestjs/common";
import { tsRestHandler, TsRestHandler } from "@ts-rest/nest";
import { MEDIA_ROUTES, providerContract } from "@flex/shared";
import type { Response } from "express";
import { CurrentMember, MemberOnly, RequirePermission } from "../core/auth/auth.decorators";
import type { MemberContext } from "../core/auth/auth.types";
import {
	AudioUploadInterceptor,
	DiscardFailedUploadInterceptor,
	ImageUploadInterceptor,
} from "../media/media.interceptor";
import { MediaService, type UploadedMedia } from "../media/media.service";
import { MusicService } from "./music.service";

@Controller()
export class MusicController {
	constructor(
		private readonly musicService: MusicService,
		private readonly media: MediaService,
	) {}

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
			body: await this.musicService.create(body, member.uuid),
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

	@Get(MEDIA_ROUTES.audio)
	async audioFile(
		@Param("uuid", ParseUUIDPipe) uuid: string,
		@Query("token") token: string,
		@Res() response: Response,
	) {
		await this.media.serve("audio", uuid, token, response);
	}

	@TsRestHandler(providerContract.music.uploadAudio)
	@RequirePermission("MANAGE_CATALOG")
	@UseInterceptors(DiscardFailedUploadInterceptor, AudioUploadInterceptor)
	uploadAudio(@UploadedFile() file: UploadedMedia | undefined) {
		return tsRestHandler(providerContract.music.uploadAudio, async ({ params }) => {
			await this.media.save("audio", params.uuid, file);
			return { status: 204, body: null };
		});
	}

	@Get(MEDIA_ROUTES.musicCover)
	async coverFile(
		@Param("uuid", ParseUUIDPipe) uuid: string,
		@Query("token") token: string,
		@Res() response: Response,
	) {
		await this.media.serve("musicCover", uuid, token, response);
	}

	@TsRestHandler(providerContract.music.uploadCover)
	@RequirePermission("MANAGE_CATALOG")
	@UseInterceptors(DiscardFailedUploadInterceptor, ImageUploadInterceptor)
	uploadCover(@UploadedFile() file: UploadedMedia | undefined) {
		return tsRestHandler(providerContract.music.uploadCover, async ({ params }) => {
			await this.media.save("musicCover", params.uuid, file);
			return { status: 204, body: null };
		});
	}

	@TsRestHandler(providerContract.music.removeCover)
	@RequirePermission("MANAGE_CATALOG")
	removeCover() {
		return tsRestHandler(providerContract.music.removeCover, async ({ params }) => {
			await this.media.clear("musicCover", params.uuid);
			return { status: 204, body: null };
		});
	}
}
