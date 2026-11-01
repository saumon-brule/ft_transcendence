import { BadRequestException, Injectable, NotFoundException, UnsupportedMediaTypeException } from "@nestjs/common";
import type { MediaType } from "@flex/shared";
import type { Response } from "express";
import { mkdir, rename, rm, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { env } from "../core/env";
import { PrismaService } from "../core/prisma/prisma.service";
import { declaredMismatch, MEDIA_TYPE_CONFIG } from "./media-types";
import { MediaTokenService } from "./media-token.service";

export interface UploadedMedia {
	fieldname: string;
	originalname: string;
	mimetype: string;
	path: string;
	size: number;
}

interface MediaTarget {
	find: (uuid: string) => Promise<{ id: number; present: boolean } | null>;
	set: (id: number, present: boolean) => Promise<unknown>;
}

@Injectable()
export class MediaService {
	private readonly targets: Record<MediaType, MediaTarget> = {
		"audio": {
			find: async (uuid) => {
				const row = await this.prisma.music.findUnique({ where: { uuid }, select: { id: true, hasAudio: true } });
				return row && { id: row.id, present: row.hasAudio };
			},
			set: (id, present) => this.prisma.music.update({ where: { id }, data: { hasAudio: present } }),
		},
		"musicCover": {
			find: async (uuid) => {
				const row = await this.prisma.music.findUnique({ where: { uuid }, select: { id: true, hasCover: true } });
				return row && { id: row.id, present: row.hasCover };
			},
			set: (id, present) => this.prisma.music.update({ where: { id }, data: { hasCover: present } }),
		},
		"albumCover": {
			find: async (uuid) => {
				const row = await this.prisma.album.findUnique({ where: { uuid }, select: { id: true, hasCover: true } });
				return row && { id: row.id, present: row.hasCover };
			},
			set: (id, present) => this.prisma.album.update({ where: { id }, data: { hasCover: present } }),
		},
		"artistAvatar": {
			find: async (uuid) => {
				const row = await this.prisma.artist.findUnique({ where: { uuid }, select: { id: true, hasAvatar: true } });
				return row && { id: row.id, present: row.hasAvatar };
			},
			set: (id, present) => this.prisma.artist.update({ where: { id }, data: { hasAvatar: present } }),
		},
	};

	private readonly root = resolve(process.cwd(), env.MEDIA_DIR);

	constructor(
		private readonly prisma: PrismaService,
		private readonly tokens: MediaTokenService,
	) {}

	private pathOf(directory: string, uuid: string, extension: string) {
		return join(this.root, directory, `${uuid}.${extension}`);
	}

	private async findFile(directory: string, uuid: string, extensions: string[]) {
		for (const extension of extensions) {
			const path = this.pathOf(directory, uuid, extension);
			const info = await stat(path).catch(() => undefined);
			if (info?.isFile()) return { path, size: info.size, extension };
		}
		return undefined;
	}

	private async placeFile(uploadPath: string, directory: string, uuid: string, extension: string) {
		const finalPath = this.pathOf(directory, uuid, extension);
		await mkdir(dirname(finalPath), { recursive: true });
		await rename(uploadPath, finalPath);
	}

	private async removeFiles(directory: string, uuid: string, extensions: string[], keep?: string) {
		await Promise.all(extensions
			.filter((extension) => extension !== keep)
			.map((extension) => rm(this.pathOf(directory, uuid, extension), { force: true })));
	}

	private async findTarget(type: MediaType, uuid: string) {
		const config = MEDIA_TYPE_CONFIG[type];
		const row = await this.targets[type].find(uuid);
		if (!row) throw new NotFoundException(`${config.label} not found`);
		return { config, row };
	}

	private requirePresent(type: MediaType, present: boolean) {
		if (present) return;

		const { label, noun } = MEDIA_TYPE_CONFIG[type];
		throw new NotFoundException(`This ${label.toLowerCase()} has no ${noun} yet`);
	}

	async serve(type: MediaType, uuid: string, token: string, response: Response) {
		await this.tokens.authorize(token);

		const { config, row } = await this.findTarget(type, uuid);
		this.requirePresent(type, row.present);

		const file = await this.findFile(config.directory, uuid, Object.keys(config.formats));
		if (!file) throw new NotFoundException("File missing on disk");

		response.sendFile(file.path, {
			dotfiles: "deny",
			headers: {
				"Content-Type": config.formats[file.extension].mime,
				"Cache-Control": config.cacheControl,
				"X-Content-Type-Options": "nosniff",
				"Referrer-Policy": "no-referrer",
			},
		});
	}

	async save(type: MediaType, uuid: string, upload: UploadedMedia | undefined) {
		if (!upload) {
			throw new BadRequestException("A file is required in the \"file\" field");
		}

		try {
			const { config, row } = await this.findTarget(type, uuid);

			if (upload.size === 0) {
				throw new BadRequestException("Empty file");
			}

			const extension = await config.inspect(upload.path);
			if (!extension) {
				throw new UnsupportedMediaTypeException(`The file is not a valid ${config.noun} (${config.accepted})`);
			}

			const mismatch = declaredMismatch(config.formats[extension], upload.originalname, upload.mimetype);
			if (mismatch) {
				throw new UnsupportedMediaTypeException(`Rejected: ${mismatch}`);
			}

			await this.placeFile(upload.path, config.directory, uuid, extension);
			await this.targets[type].set(row.id, true);
			await this.removeFiles(config.directory, uuid, Object.keys(config.formats), extension);
		} catch (error) {
			await rm(upload.path, { force: true });
			throw error;
		}
	}

	async clear(type: MediaType, uuid: string) {
		const { config, row } = await this.findTarget(type, uuid);
		if (!row.present) return;

		await this.targets[type].set(row.id, false);
		await this.removeFiles(config.directory, uuid, Object.keys(config.formats));
	}

	async discard(type: MediaType, uuid: string) {
		const config = MEDIA_TYPE_CONFIG[type];
		await this.removeFiles(config.directory, uuid, Object.keys(config.formats));
	}
}
