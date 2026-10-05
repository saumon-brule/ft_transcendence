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
import { ASSET_DIR, COVER_DIR, MAX_SIZE } from "../core/utils/constants";

@Controller()
export class PlaylistsController {
	constructor(private readonly playlistsService: PlaylistsService) {}

	@UseInterceptors(FileInterceptor("cover"))
	@TsRestHandler(playlistsContract.uploadCover)
	@UseGuards(JwtAuthGuard)
	public uploadCover(
		@UploadedFile(new ParseFilePipe({ validators: [
			new FileTypeValidator({ fileType: /image\/(jpeg|jpg|png|webp)$/ }),
			new MaxFileSizeValidator({ maxSize: MAX_SIZE }),
		] }))
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
}
