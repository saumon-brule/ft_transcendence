import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { diskStorage } from "multer";
import { catchError, from, mergeMap, throwError } from "rxjs";
import { env } from "../core/env";

export const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;

const incomingDir = join(resolve(process.cwd(), env.MUSIC_DIR), ".incoming");

export interface UploadedAudio {
	fieldname: string;
	originalname: string;
	mimetype: string;
	path: string;
	size: number;
}

export const audioUploadStorage = diskStorage({
	destination: incomingDir,
	filename: (_request, _file, callback) => callback(null, `${randomUUID()}.part`),
});

@Injectable()
export class DiscardFailedUploadInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler) {
		const request = context.switchToHttp().getRequest<{ file?: UploadedAudio }>();

		return next.handle().pipe(
			catchError((error: unknown) => from(rm(request.file?.path ?? "", { force: true })).pipe(
				mergeMap(() => throwError(() => error)),
			)),
		);
	}
}
