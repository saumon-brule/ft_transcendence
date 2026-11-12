import {
	Controller,
	UseGuards,
	UseInterceptors,
	UploadedFile,
	ParseFilePipe,
	FileTypeValidator,
	MaxFileSizeValidator,
	Get,
	StreamableFile,
	Param,
	BadRequestException,
} from "@nestjs/common";
import { PlaylistsService } from "./playlists.service";
import {
	type AuthUser,
	CurrentUser,
} from "../core/decorators/current-user.decorator";
import {
	MAX_SIZE,
	playlistsContract,
} from "@flex/shared";
import { tsRestHandler, TsRestHandler } from "@ts-rest/nest";
import { JwtAuthGuard } from "../core/guards/jwt-auth.guard";
import { FileInterceptor } from "@nestjs/platform-express";
import { join } from "node:path";
import type { Express } from "express";
import sharp from "sharp";
import { isUUID } from "../core/utils/isUuid";
import { createReadStream, existsSync } from "node:fs";
import { ASSET_DIR, COVER_DIR } from "../core/utils/constants";
import { AppForbiddenException } from "../core/error/forbidden";

@Controller()
export class PlaylistsController {
	constructor(private readonly playlistsService: PlaylistsService) {}

	@UseInterceptors(FileInterceptor("cover"))
	@TsRestHandler(playlistsContract.uploadCover)
	@UseGuards(JwtAuthGuard)
	public uploadCover(
		@UploadedFile(new ParseFilePipe({
			validators: [
				new FileTypeValidator({ fileType: /image\/(jpeg|jpg|png|webp)$/ }),
				new MaxFileSizeValidator({ maxSize: MAX_SIZE }),
			],
		}))
		file: Express.Multer.File,
		@CurrentUser() authUser: AuthUser,
	) {
		return tsRestHandler(playlistsContract.uploadCover, async ({ params }) => {
			const playlist = await this.playlistsService.getPlaylistByUUID(params.uuid);

			if (playlist.owner.uuid !== authUser.uuid) {
				throw new BadRequestException("You are not the owner of this playlist");
			}

			const filename = `${playlist.uuid}.webp`;
			const filepath = join(COVER_DIR, filename);

			await sharp(file.buffer)
				.resize(256, 256, { fit: "cover" })
				.webp({ quality: 80 })
				.toFile(filepath);

			return { status: 204, body: null };
		});
	}

	@Get("playlists/:uuid/cover")
	getCover(@Param("uuid") uuid: string): StreamableFile {
		if (!isUUID(uuid)) {
			throw new BadRequestException("Invalid UUID");
		}
		const filename = `${uuid}.webp`;

		let filepath = join(COVER_DIR, filename);
		if (!existsSync(filepath)) {
			filepath = join(ASSET_DIR, "playlist.webp");
		}

		return new StreamableFile(createReadStream(filepath), {
			type: "image/webp",
			disposition: "inline",
		});
	}

	@TsRestHandler(playlistsContract.updatePlaylistName)
	@UseGuards(JwtAuthGuard)
	public updatePlaylistName(@CurrentUser() authUser: AuthUser) {
		return tsRestHandler(playlistsContract.updatePlaylistName, async ({ params, body }) => {
			await this.playlistsService.updatePlaylistName(
				params.uuid,
				body.name,
				authUser.uuid,
			);

			return { status: 204, body: null };
		});
	}

	@TsRestHandler(playlistsContract.setPlaylistPrivacy)
	@UseGuards(JwtAuthGuard)
	public setPlaylistPrivacy(@CurrentUser() authUser: AuthUser) {
		return tsRestHandler(playlistsContract.setPlaylistPrivacy, async ({ params, body }) => {
			await this.playlistsService.setPlaylistPrivacy(
				params.uuid,
				body.private,
				authUser.uuid,
			);

			return { status: 204, body: null };
		});
	}

	@TsRestHandler(playlistsContract.createPlaylist)
	@UseGuards(JwtAuthGuard)
	public createPlaylist(@CurrentUser() authUser: AuthUser) {
		return tsRestHandler(playlistsContract.createPlaylist, async ({ body }) => {
			const playlist = await this.playlistsService.createPlaylist(
				body.name,
				authUser.uuid,
				body.private,
			);

			return {
				status: 201,
				body: {
					uuid: playlist.uuid,
					name: playlist.name,
					private: playlist.private,
				},
			};
		});
	}

	@TsRestHandler(playlistsContract.addMusicToPlaylist)
	@UseGuards(JwtAuthGuard)
	public addMusicToPlaylist(@CurrentUser() authUser: AuthUser) {
		return tsRestHandler(
			playlistsContract.addMusicToPlaylist, async ({ params, body }) => {
				await this.playlistsService.addMusicToPlaylist(
					params.uuid,
					body.musicUUID,
					body.providerUUID,
					authUser.uuid,
				);

				return { status: 204, body: null };
			},
		);
	}

	@TsRestHandler(playlistsContract.removeMusicFromPlaylist)
	@UseGuards(JwtAuthGuard)
	public removeMusicFromPlaylist(@CurrentUser() authUser: AuthUser) {
		return tsRestHandler(
			playlistsContract.removeMusicFromPlaylist, async ({ params, body }) => {
				await this.playlistsService.removeMusicFromPlaylist(
					params.uuid,
					body.musicUUID,
					body.providerUUID,
					authUser.uuid,
				);

				return { status: 204, body: null };
			},
		);
	}

	@TsRestHandler(playlistsContract.deletePlaylist)
	@UseGuards(JwtAuthGuard)
	public deletePlaylist(@CurrentUser() authUser: AuthUser) {
		return tsRestHandler(
			playlistsContract.deletePlaylist, async ({ params }) => {
				await this.playlistsService.deletePlaylist(params.uuid, authUser.uuid);

				return { status: 204, body: null };
			},
		);
	}

	@TsRestHandler(playlistsContract.followPlaylist)
	@UseGuards(JwtAuthGuard)
	public followPlaylist(@CurrentUser() authUser: AuthUser) {
		return tsRestHandler(playlistsContract.followPlaylist, async ({ params }) => {
			await this.playlistsService.followPlaylist(authUser.uuid, params.uuid);
			return { status: 204, body: null };
		});
	}

	@TsRestHandler(playlistsContract.unfollowPlaylist)
	@UseGuards(JwtAuthGuard)
	public unfollowPlaylist(@CurrentUser() authUser: AuthUser) {
		return tsRestHandler(playlistsContract.unfollowPlaylist, async ({ params }) => {
			await this.playlistsService.unfollowPlaylist(authUser.uuid, params.uuid);
			return { status: 204, body: null };
		});
	}
}
