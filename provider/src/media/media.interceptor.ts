import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { diskStorage } from "multer";
import { catchError, from, mergeMap, throwError } from "rxjs";
import { env } from "../core/env";
import type { UploadedMedia } from "./media.service";

const MAX_AUDIO_BYTES = 200 * 1024 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const uploadStorage = diskStorage({
	destination: join(resolve(process.cwd(), env.MEDIA_DIR), ".incoming"),
	filename: (_request, _file, callback) => callback(null, `${randomUUID()}.part`),
});

const uploadInterceptor = (maxBytes: number) => FileInterceptor("file", {
	storage: uploadStorage,
	limits: { fileSize: maxBytes, files: 1, fields: 0 },
});

export const AudioUploadInterceptor = uploadInterceptor(MAX_AUDIO_BYTES);
export const ImageUploadInterceptor = uploadInterceptor(MAX_IMAGE_BYTES);

@Injectable()
export class DiscardFailedUploadInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler) {
		const request = context.switchToHttp().getRequest<{ file?: UploadedMedia }>();

		return next.handle().pipe(
			catchError((error: unknown) => from(rm(request.file?.path ?? "", { force: true })).pipe(
				mergeMap(() => throwError(() => error)),
			)),
		);
	}
}
