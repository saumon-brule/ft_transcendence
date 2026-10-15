import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import { Code401, code401, Code403, code403 } from "@flex/shared";
import { STATUS_CODES } from "node:http";
import { Response } from "express";
import { Prisma } from "../../generated/client/client";
import { env } from "../env";
import { isWriteConflict } from "../prisma/write-conflict";

interface ValidationResult {
	issues: { message: string }[];
}

interface TsRestException {
	response?: {
		bodyResult?: ValidationResult;
		paramsResult?: ValidationResult;
		queryResult?: ValidationResult;
		headersResult?: ValidationResult;
		error?: string;
		message?: string | string[];
		code?: string;
	};
	status?: number;
	message?: string;
	// Posé par http-errors (body-parser, send...) : false = message interne, à ne pas montrer au client
	expose?: boolean;
}

@Catch()
export class TsRestValidationFilter implements ExceptionFilter {
	catch(exception: TsRestException, host: ArgumentsHost) {
		const response = host.switchToHttp().getResponse<Response>();

		if (response.headersSent) return;

		if (env.NODE_ENV === "dev") {
			console.error(exception);
		}

		if (isWriteConflict(exception)) {
			return response.status(409).json({
				statusCode: 409,
				error: "Conflict",
				message: "Concurrent modification, please retry",
			});
		}

		if (exception instanceof Prisma.PrismaClientKnownRequestError) {
			// P2002: unique constraint
			if (exception.code === "P2002") {
				return response.status(409).json({
					statusCode: 409,
					error: "Conflict",
					message: "This element already exists",
				});
			}

			// P2003: foreign key, P2025: record not found
			if (exception.code === "P2003" || exception.code === "P2025") {
				return response.status(404).json({
					statusCode: 404,
					error: "Not Found",
					message: "Related resource not found",
				});
			}
		}

		const validation = exception?.response;
		if (validation?.bodyResult || validation?.paramsResult || validation?.queryResult || validation?.headersResult) {
			const messages = [
				...(validation.bodyResult?.issues ?? []),
				...(validation.paramsResult?.issues ?? []),
				...(validation.queryResult?.issues ?? []),
				...(validation.headersResult?.issues ?? []),
			].map((issue) => issue.message);

			return response.status(400).json({
				statusCode: 400,
				error: "Bad Request",
				message: messages.length
					? messages
					: ["Bad Request"],
			});
		}

		const status = exception?.status ?? 500;

		if (status === 401) {
			const code = code401.includes(validation?.code as Code401)
				? (validation?.code as Code401)
				: "UNAUTHORIZED";

			return response.status(401).json({
				statusCode: 401,
				error: "Unauthorized",
				message: validation?.message ?? "Unauthorized",
				code,
			});
		}

		if (status === 403) {
			const code = code403.includes(validation?.code as Code403)
				? (validation?.code as Code403)
				: "FORBIDDEN";

			return response.status(403).json({
				statusCode: 403,
				error: "Forbidden",
				message: validation?.message ?? "Forbidden",
				code,
			});
		}

		if (status >= 500 && !(exception instanceof HttpException)) {
			if (env.NODE_ENV !== "dev") {
				console.error(exception);
			}
			return response.status(500).json({
				statusCode: 500,
				error: "Internal Server Error",
				message: "Internal Server Error",
			});
		}

		// Les messages des exceptions Nest et des erreurs http-errors "exposées" sont faits pour le client ;
		// les autres (erreur de fichier de send, avec le chemin du serveur...) sont remplacés par le libellé du statut
		const isClientSafe = exception instanceof HttpException || exception?.expose === true;
		const fallbackMessage = isClientSafe
			? exception?.message
			: undefined;

		return response.status(status).json({
			statusCode: status,
			error: validation?.error ?? "",
			message: validation?.message ?? fallbackMessage ?? STATUS_CODES[status] ?? "Error",
		});
	}
}
