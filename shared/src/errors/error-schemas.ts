import { z } from "zod";
import {
	commonCode400,
	commonCode404,
	commonCode409,
	commonCode413,
	commonCode415,
	commonCode429,
	commonCode401,
	providerCode403,
	providerCode409,
	serverAuthCode401,
	serverBaseCode401,
	serverCode403,
} from "./error-codes";

function errorSchema<S extends number, const T extends readonly [string, ...string[]]>(statusCode: S, codes: T) {
	return z.object({
		statusCode: z.literal(statusCode),
		message: z.string(),
		code: z.enum(codes),
	});
}

export const commonError400Schema = errorSchema(400, commonCode400).extend({
	message: z.array(z.string()),
});

export const serverBaseError401Schema = errorSchema(401, serverBaseCode401);
export const serverAuthError401Schema = errorSchema(401, serverAuthCode401);
export const providerError401Schema = errorSchema(401, commonCode401);

export const serverError403Schema = errorSchema(403, serverCode403);
export const providerError403Schema = errorSchema(403, providerCode403);

export const commonError404Schema = errorSchema(404, commonCode404);

export const commonError409Schema = errorSchema(409, commonCode409);
export const providerError409Schema = errorSchema(409, providerCode409);

export const commonError413Schema = errorSchema(413, commonCode413);
export const commonError415Schema = errorSchema(415, commonCode415);

export const commonError429Schema = errorSchema(429, commonCode429).extend({
	retryAfter: z.number(),
});
