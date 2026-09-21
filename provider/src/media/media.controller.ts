import { Controller, Get, HttpCode, Param, ParseUUIDPipe, Put, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { RequirePermission } from "../core/auth/auth.decorators";
import { MediaService } from "./media.service";

@Controller()
export class MediaController {
	constructor(private readonly media: MediaService) {}

	@Put("music/:uuid/file")
	@RequirePermission("MANAGE_CATALOG")
	@HttpCode(204)
	async upload(@Param("uuid", ParseUUIDPipe) uuid: string, @Req() request: Request) {
		await this.media.saveMusicFile(uuid, request);
	}

	@Get("media/:token")
	async stream(@Param("token") token: string, @Res() response: Response) {
		const { path, mime } = await this.media.resolveStream(token);

		response.sendFile(path, {
			dotfiles: "deny",
			headers: { "Content-Type": mime, "Cache-Control": "private, no-store" },
		});
	}
}
