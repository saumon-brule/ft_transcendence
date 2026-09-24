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
import { UsersService } from "./users.service";
import {
	type AuthUser,
	CurrentUser,
} from "../core/decorators/current-user.decorator";
import {
	userSchema,
	meSchema,
	usersContract,
	rolesListDetailedResponseSchema,
	rolesListResponseSchema,
} from "@flex/shared";
import { tsRestHandler, TsRestHandler } from "@ts-rest/nest";
import { RequirePermission } from "../core/decorators/require-permission.decorator";
import { PERMISSIONS } from "@flex/shared";
import { JwtAuthGuardWithoutEmailVerif, JwtAuthGuard } from "../core/guards/jwt-auth.guard";
import { FileInterceptor } from "@nestjs/platform-express";
import { join } from "node:path";
import type { Express } from "express";
import sharp from "sharp";
import { isUUID } from "../core/utils/isUuid";
import { createReadStream, existsSync } from "node:fs";

const AVATAR_DIR = join(process.cwd(), "uploads", "avatars");
const ASSET_DIR = join(process.cwd(), "assets");
const MAX_SIZE = 5 * 1024 * 1024;

@Controller()
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@TsRestHandler(usersContract.me)
	@UseGuards(JwtAuthGuardWithoutEmailVerif)
	public me(@CurrentUser() authUser: AuthUser) {
		return tsRestHandler(usersContract.me, async () => {
			const user = await this.usersService.getExposedInfoByUUID(authUser.uuid);
			return { status: 200, body: meSchema.parse(user) };
		});
	}

	@TsRestHandler(usersContract.getUser)
	@UseGuards(JwtAuthGuard)
	public getUser() {
		return tsRestHandler(usersContract.getUser, async ({ params }) => {
			const user = await this.usersService.getExposedInfoByUUID(params.uuid);
			return { status: 200, body: userSchema.parse(user) };
		});
	}

	@UseInterceptors(FileInterceptor("avatar"))
	@TsRestHandler(usersContract.uploadAvatar)
	@UseGuards(JwtAuthGuard)
	public uploadAvatar(
		@UploadedFile(new ParseFilePipe({ validators: [
			new FileTypeValidator({ fileType: /image\/(jpeg|jpg|png|webp)$/ }),
			new MaxFileSizeValidator({ maxSize: MAX_SIZE }),
		] }))
		file: Express.Multer.File,
		@CurrentUser() authUser: AuthUser,
	) {
		return tsRestHandler(usersContract.uploadAvatar, async () => {
			const filename = `${authUser.uuid}.webp`;
			const filepath = join(AVATAR_DIR, filename);

			await sharp(file.buffer)
				.resize(256, 256, { fit: "cover" })
				.webp({ quality: 80 })
				.toFile(filepath);

			return { status: 204, body: null };
		});
	}

	@Get("user/:uuid/avatar")
	getAvatar(@Param("uuid") uuid: string): StreamableFile {
		if (!isUUID(uuid)) {
			throw new BadRequestException("Invalid UUID");
		}
		const filename = `${uuid}.webp`;

		let filepath = join(AVATAR_DIR, filename);
		if (!existsSync(filepath)) {
			filepath = join(ASSET_DIR, "avatar.webp");
		}

		return new StreamableFile(createReadStream(filepath), {
			type: "image/webp",
			disposition: "inline",
		});
	}

	@TsRestHandler(usersContract.getUserRoles)
	@RequirePermission(PERMISSIONS.MEMBERS.GET_ROLES)
	public getUserRoles() {
		return tsRestHandler(usersContract.getUserRoles, async ({ params }) => {
			const users = await this.usersService.getUserRoles(params.id);
			return { status: 200, body: rolesListResponseSchema.parse(users) };
		});
	}

	@TsRestHandler(usersContract.getUserRolesDetailed)
	@RequirePermission(PERMISSIONS.MEMBERS.GET_ROLES_DETAILED)
	public getUserRolesDetailed() {
		return tsRestHandler(usersContract.getUserRolesDetailed, async ({ params }) => {
			const user = await this.usersService.getUserRolesDetailed(params.id);
			return { status: 200, body: rolesListDetailedResponseSchema.parse(user) };
		});
	}

	@TsRestHandler(usersContract.addUserRole)
	@RequirePermission(PERMISSIONS.MEMBERS.CHANGE_ROLES)
	public addRoleToUser() {
		return tsRestHandler(
			usersContract.addUserRole,
			async ({ params, body }) => {
				await this.usersService.addRoleToUser(params.id, body.roleId);
				return { status: 204, body: null };
			},
		);
	}

	@TsRestHandler(usersContract.removeUserRole)
	@RequirePermission(PERMISSIONS.MEMBERS.CHANGE_ROLES)
	public removeRoleFromUser() {
		return tsRestHandler(
			usersContract.removeUserRole,
			async ({ params }) => {
				await this.usersService.removeRoleFromUser(
					params.id,
					params.roleId,
				);
				return { status: 204, body: null };
			},
		);
	}
}
