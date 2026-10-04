import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException,
	PayloadTooLargeException,
	UnauthorizedException,
	UnsupportedMediaTypeException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { createWriteStream } from "node:fs";
import { mkdir, rename, rm, stat } from "node:fs/promises";
import { randomBytes, randomUUID } from "node:crypto";
import { dirname, extname, resolve, sep } from "node:path";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { Request } from "express";
import { z } from "zod";
import { env } from "../core/env";
import { PrismaService } from "../core/prisma/prisma.service";

export const NO_FILE = "";

const TOKEN_TTL_SECONDS = 300;
const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;

const AUDIO_TYPES: Record<string, string> = {
	"audio/mpeg": "mp3",
	"audio/mp4": "m4a",
	"audio/aac": "aac",
	"audio/flac": "flac",
	"audio/ogg": "ogg",
	"audio/wav": "wav",
	"audio/x-wav": "wav",
	"audio/webm": "webm",
};

const MIME_BY_EXTENSION = Object.fromEntries(
	Object.entries(AUDIO_TYPES).map(([mime, extension]) => [extension, mime]),
);

const audioClaimsSchema = z.object({
	sub: z.string().uuid(),
	music: z.string().uuid(),
});

@Injectable()
export class MusicAudioService {
	private readonly tokenSecret = randomBytes(32).toString("hex");
	private readonly root = resolve(process.cwd(), env.MUSIC_DIR);

	constructor(
		private readonly jwt: JwtService,
		private readonly prisma: PrismaService,
	) {}

	private absolutePath(relativePath: string) {
		const absolute = resolve(this.root, relativePath);
		if (!absolute.startsWith(this.root + sep)) {
			throw new BadRequestException("Invalid file path");
		}
		return absolute;
	}

	private async findMusic(musicUuid: string) {
		const music = await this.prisma.music.findUnique({
			where: { uuid: musicUuid },
			select: { id: true, path: true },
		});
		if (!music) throw new NotFoundException("Music not found");
		return music;
	}

	async createAudioUrl(origin: string, musicUuid: string, userUuid: string) {
		const music = await this.findMusic(musicUuid);
		if (music.path === NO_FILE) {
			throw new NotFoundException("This music has no audio file yet");
		}

		const token = await this.jwt.signAsync({ music: musicUuid }, {
			secret: this.tokenSecret,
			algorithm: "HS256",
			subject: userUuid,
			expiresIn: TOKEN_TTL_SECONDS,
		});

		return {
			url: `${origin}/music/${musicUuid}/audio?token=${encodeURIComponent(token)}`,
			expiresAt: new Date(Date.now() + TOKEN_TTL_SECONDS * 1000),
		};
	}

	/** Vérifie le token de l'URL, qu'il vise bien cette musique, et que le membre a toujours accès. */
	async resolveAudio(musicUuid: string, token: string) {
		let claims: z.infer<typeof audioClaimsSchema>;
		try {
			const payload = await this.jwt.verifyAsync(token, {
				secret: this.tokenSecret,
				algorithms: ["HS256"],
			});
			claims = audioClaimsSchema.parse(payload);
		} catch {
			throw new UnauthorizedException({
				code: "INVALID_TOKEN",
				message: "Invalid or expired audio link",
			});
		}

		if (claims.music !== musicUuid) {
			throw new UnauthorizedException({
				code: "INVALID_TOKEN",
				message: "This link does not match this music",
			});
		}

		const member = await this.prisma.member.findUnique({ where: { uuid: claims.sub } });
		if (!member || member.revokedAt) {
			throw new ForbiddenException({
				code: "MEMBER_REVOKED",
				message: "Your access to this provider has been revoked",
			});
		}

		const music = await this.findMusic(musicUuid);
		if (music.path === NO_FILE) {
			throw new NotFoundException("This music has no audio file yet");
		}

		const absolute = this.absolutePath(music.path);
		const { size } = await stat(absolute).catch(() => {
			throw new NotFoundException("Audio file missing on disk");
		});

		return {
			path: absolute,
			size,
			mime: MIME_BY_EXTENSION[extname(music.path).slice(1)] ?? "application/octet-stream",
		};
	}

	async saveFile(musicUuid: string, request: Request) {
		const contentType = (request.headers["content-type"] ?? "").split(";")[0].trim().toLowerCase();
		const extension = AUDIO_TYPES[contentType];
		if (!extension) {
			throw new UnsupportedMediaTypeException("Unsupported audio type");
		}

		if (Number(request.headers["content-length"]) > MAX_UPLOAD_BYTES) {
			throw new PayloadTooLargeException("File too large");
		}

		const music = await this.findMusic(musicUuid);

		const relativePath = `music/${musicUuid}.${extension}`;
		const finalPath = this.absolutePath(relativePath);
		const temporaryPath = `${finalPath}.${randomUUID()}.part`;
		await mkdir(dirname(finalPath), { recursive: true });

		let received = 0;
		const limiter = new Transform({
			transform(chunk: Buffer, _encoding, callback) {
				received += chunk.length;
				if (received > MAX_UPLOAD_BYTES) {
					callback(new PayloadTooLargeException("File too large"));
					return;
				}
				callback(null, chunk);
			},
		});

		try {
			await pipeline(request, limiter, createWriteStream(temporaryPath));
			if (received === 0) {
				throw new BadRequestException("Empty file");
			}
			await rename(temporaryPath, finalPath);
		} catch (error) {
			await rm(temporaryPath, { force: true });
			throw error;
		}

		await this.prisma.music.update({ where: { id: music.id }, data: { path: relativePath } });

		if (music.path !== NO_FILE && music.path !== relativePath) {
			await this.deleteFile(music.path);
		}
	}

	async deleteFile(relativePath: string) {
		if (relativePath === NO_FILE) return;
		await rm(this.absolutePath(relativePath), { force: true });
	}
}
