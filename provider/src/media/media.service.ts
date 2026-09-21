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
import { mkdir, rename, rm } from "node:fs/promises";
import { randomBytes, randomUUID } from "node:crypto";
import { dirname, extname, resolve, sep } from "node:path";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { Request } from "express";
import { z } from "zod";
import { env } from "../core/env";
import { PrismaService } from "../core/prisma/prisma.service";

// Chemin stocké tant qu'aucun fichier audio n'a été envoyé
export const NO_FILE = "";

const STREAM_TTL_SECONDS = 300;
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

const streamClaimsSchema = z.object({
	sub: z.string().uuid(),
	music: z.string().uuid(),
});

@Injectable()
export class MediaService {
	private readonly streamSecret = randomBytes(32).toString("hex");
	private readonly root = resolve(process.cwd(), env.MEDIA_DIR);

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

	async createStreamUrl(origin: string, musicUuid: string, userUuid: string) {
		const token = await this.jwt.signAsync({ music: musicUuid }, {
			secret: this.streamSecret,
			algorithm: "HS256",
			subject: userUuid,
			expiresIn: STREAM_TTL_SECONDS,
		});

		return {
			url: `${origin}/media/${token}`,
			expiresAt: new Date(Date.now() + STREAM_TTL_SECONDS * 1000),
		};
	}

	async resolveStream(token: string) {
		let claims: z.infer<typeof streamClaimsSchema>;
		try {
			const payload = await this.jwt.verifyAsync(token, {
				secret: this.streamSecret,
				algorithms: ["HS256"],
			});
			claims = streamClaimsSchema.parse(payload);
		} catch {
			throw new UnauthorizedException({
				code: "INVALID_TOKEN",
				message: "Invalid or expired stream link",
			});
		}

		const member = await this.prisma.member.findUnique({ where: { uuid: claims.sub } });
		if (!member || member.revokedAt) {
			throw new ForbiddenException({
				code: "MEMBER_REVOKED",
				message: "Your access to this provider has been revoked",
			});
		}

		const music = await this.prisma.music.findUnique({
			where: { uuid: claims.music },
			select: { path: true },
		});
		if (!music || music.path === NO_FILE) {
			throw new NotFoundException("Audio file not found");
		}

		return {
			path: this.absolutePath(music.path),
			mime: MIME_BY_EXTENSION[extname(music.path).slice(1)] ?? "application/octet-stream",
		};
	}

	async saveMusicFile(musicUuid: string, request: Request) {
		const contentType = (request.headers["content-type"] ?? "").split(";")[0].trim().toLowerCase();
		const extension = AUDIO_TYPES[contentType];
		if (!extension) {
			throw new UnsupportedMediaTypeException("Unsupported audio type");
		}

		if (Number(request.headers["content-length"]) > MAX_UPLOAD_BYTES) {
			throw new PayloadTooLargeException("File too large");
		}

		const music = await this.prisma.music.findUnique({
			where: { uuid: musicUuid },
			select: { id: true, path: true },
		});
		if (!music) {
			throw new NotFoundException("Music not found");
		}

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
