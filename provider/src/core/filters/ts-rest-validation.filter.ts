import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import { buildErrorResponse, providerErrorScope } from "@flex/shared";
import { Response } from "express";
import { env } from "../env";
import { isWriteConflict } from "../prisma/write-conflict";

@Catch()
export class TsRestValidationFilter implements ExceptionFilter {
	catch(exception: unknown, host: ArgumentsHost) {
		const response = host.switchToHttp().getResponse<Response>();

		if (response.headersSent) return;

		if (env.NODE_ENV === "dev") {
			console.error(exception);
		}

		const error = isWriteConflict(exception)
			? { status: 409, response: { code: "CONFLICT", message: "Concurrent modification, please retry" }, getStatus: () => 409 }
			: exception;

		const retryAfter = Number(response.getHeader("Retry-After"));
		const { status, body } = buildErrorResponse(error, providerErrorScope, {
			retryAfter: Number.isNaN(retryAfter)
				? undefined
				: retryAfter,
		});

		if (status >= 500 && env.NODE_ENV !== "dev") {
			console.error(exception);
		}

		return response.status(status).json(body);
	}
}
