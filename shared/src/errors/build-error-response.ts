import {
	commonCode400,
	commonCode404,
	commonCode413,
	commonCode415,
	commonCode429,
	type ErrorScope,
} from "./error-codes";

interface ValidationResult {
	issues: { message: string }[];
}

interface ErrorLike {
	status?: number;
	message?: string;
	name?: string;
	code?: string;
	expose?: boolean;
	getStatus?: unknown;
	response?: {
		bodyResult?: ValidationResult | null;
		paramsResult?: ValidationResult | null;
		queryResult?: ValidationResult | null;
		headersResult?: ValidationResult | null;
		message?: string | string[];
		code?: string;
	};
}

export interface ErrorBody {
	statusCode: number;
	message: string | string[];
	code: string;
	retryAfter?: number;
}

export interface BuiltError {
	status: number;
	body: ErrorBody;
}

const STATUS_TEXT: Record<number, string> = {
	400: "Bad Request",
	401: "Unauthorized",
	403: "Forbidden",
	404: "Not Found",
	409: "Conflict",
	413: "Payload Too Large",
	415: "Unsupported Media Type",
	429: "Too Many Requests",
	500: "Internal Server Error",
	503: "Service Unavailable",
};

const DEFAULT_CODE: Record<number, string> = {
	400: "BAD_REQUEST",
	401: "UNAUTHORIZED",
	403: "FORBIDDEN",
	404: "NOT_FOUND",
	409: "CONFLICT",
	413: "PAYLOAD_TOO_LARGE",
	415: "UNSUPPORTED_MEDIA_TYPE",
	429: "RATE_LIMITED",
	500: "INTERNAL_ERROR",
	503: "SERVICE_UNAVAILABLE",
};

function allowedCodes(status: number, scope: ErrorScope): readonly string[] {
	switch (status) {
		case 400: return commonCode400;
		case 401: return scope[401];
		case 403: return scope[403];
		case 404: return commonCode404;
		case 409: return scope[409];
		case 413: return commonCode413;
		case 415: return commonCode415;
		case 429: return commonCode429;
		default: return [];
	}
}

function validationFailure(response: ErrorLike["response"]) {
	const parts = [
		{ code: "INVALID_BODY", result: response?.bodyResult },
		{ code: "INVALID_PARAMS", result: response?.paramsResult },
		{ code: "INVALID_QUERY", result: response?.queryResult },
		{ code: "INVALID_HEADERS", result: response?.headersResult },
	].filter((part) => part.result);

	if (!parts.length) return undefined;

	return {
		code: parts[0].code,
		messages: parts.flatMap((part) => part.result?.issues ?? []).map((issue) => issue.message),
	};
}

function prismaFailure(error: ErrorLike) {
	if (error.name !== "PrismaClientKnownRequestError") return undefined;

	if (error.code === "P2002") {
		return { status: 409, code: "CONFLICT", message: "This element already exists" };
	}
	if (error.code === "P2003" || error.code === "P2025") {
		return { status: 404, code: "NOT_FOUND", message: "Related resource not found" };
	}
	return undefined;
}

function textOf(error: ErrorLike) {
	const message = error.response?.message ?? error.message;
	return Array.isArray(message)
		? message.join(", ")
		: message;
}

export function buildErrorResponse(exception: unknown, scope: ErrorScope, options: { retryAfter?: number } = {}): BuiltError {
	const error = (typeof exception === "object" && exception !== null
		? exception
		: {}) as ErrorLike;

	const validation = validationFailure(error.response);
	if (validation) {
		return {
			status: 400,
			body: {
				statusCode: 400,
				message: validation.messages.length
					? validation.messages
					: [STATUS_TEXT[400]],
				code: validation.code,
			},
		};
	}

	const prisma = prismaFailure(error);
	if (prisma) {
		return {
			status: prisma.status,
			body: { statusCode: prisma.status, message: prisma.message, code: prisma.code },
		};
	}

	const status = typeof error.status === "number" && error.status >= 400 && error.status < 600
		? error.status
		: 500;
	const isClientSafe = typeof error.getStatus === "function" || error.expose === true;

	if (status >= 500 && !isClientSafe) {
		return {
			status: 500,
			body: { statusCode: 500, message: STATUS_TEXT[500], code: DEFAULT_CODE[500] },
		};
	}

	const candidate = error.response?.code;
	const code = candidate && allowedCodes(status, scope).includes(candidate)
		? candidate
		: (DEFAULT_CODE[status] ?? "ERROR");
	const message = (isClientSafe
		? textOf(error)
		: undefined) ?? STATUS_TEXT[status] ?? "Error";

	const body: ErrorBody = {
		statusCode: status,
		message: status === 400
			? [message]
			: message,
		code,
	};
	if (status === 429) {
		body.retryAfter = options.retryAfter !== undefined && Number.isFinite(options.retryAfter)
			? options.retryAfter
			: 0;
	}
	return { status, body };
}
