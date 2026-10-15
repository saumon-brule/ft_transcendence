import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException,
	UnauthorizedException,
	UnsupportedMediaTypeException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { mkdir, rename, rm, stat } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { dirname, extname, resolve, sep } from "node:path";
import { z } from "zod";
import { env } from "../core/env";
import { PrismaService } from "../core/prisma/prisma.service";
import { AUDIO_MIME_BY_EXTENSION, type AudioExtension, inspectAudio } from "./audio-inspection";
import type { UploadedAudio } from "./audio-upload.storage";

export const NO_FILE = "";

const TOKEN_TTL_SECONDS = 3600;

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

	async resolveAudio(musicUuid: string, token: string) {
		let claims: z.infer<typeof audioClaimsSchema>;
		try {
			const payload: unknown = await this.jwt.verifyAsync(token, {
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
			mime: AUDIO_MIME_BY_EXTENSION[extname(music.path).slice(1) as AudioExtension] ?? "application/octet-stream",
		};
	}

	async saveFile(musicUuid: string, upload: UploadedAudio | undefined) {
		if (!upload) {
			throw new BadRequestException("A file is required in the \"file\" field");
		}

		try {
			if (upload.size === 0) {
				throw new BadRequestException("Empty file");
			}

			const audio = await inspectAudio(upload.path);
			if (!audio) {
				throw new UnsupportedMediaTypeException("The file is not a valid audio file (mp3, m4a, aac, flac, ogg, wav or webm)");
			}

			const music = await this.findMusic(musicUuid);

			const relativePath = `${musicUuid}.${audio.extension}`;
			const finalPath = this.absolutePath(relativePath);
			await mkdir(dirname(finalPath), { recursive: true });
			await rename(upload.path, finalPath);

			await this.prisma.music.update({ where: { id: music.id }, data: { path: relativePath } });

			if (music.path !== NO_FILE && music.path !== relativePath) {
				await this.deleteFile(music.path);
			}
		} catch (error) {
			await rm(upload.path, { force: true });
			throw error;
		}
	}

	async deleteFile(relativePath: string) {
		if (relativePath === NO_FILE) return;
		await rm(this.absolutePath(relativePath), { force: true });
	}
}
