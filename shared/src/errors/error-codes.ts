export const commonCode400 = [
	"INVALID_BODY",
	"INVALID_PARAMS",
	"INVALID_QUERY",
	"INVALID_HEADERS",
	"BAD_REQUEST",
] as const;
export type CommonCode400 = (typeof commonCode400)[number];

export const commonCode401 = [
	"INVALID_TOKEN",
	"UNAUTHORIZED",
] as const;
export type CommonCode401 = (typeof commonCode401)[number];

export const serverBaseCode401 = [
	...commonCode401,
	"INVALID_REFRESH_TOKEN",
] as const;
export type ServerBaseCode401 = (typeof serverBaseCode401)[number];

export const serverAuthCode401 = [
	"INVALID_CREDENTIALS",
	"INTRA_ONLY_ACCOUNT",
] as const;
export type ServerAuthCode401 = (typeof serverAuthCode401)[number];

export const serverCode401 = [...serverBaseCode401, ...serverAuthCode401] as const;
export type ServerCode401 = (typeof serverCode401)[number];

export const providerCode401 = commonCode401;
export type ProviderCode401 = CommonCode401;

export const commonCode403 = [
	"FORBIDDEN",
	"INVALID_PERMISSION",
] as const;
export type CommonCode403 = (typeof commonCode403)[number];

export const serverCode403 = [
	...commonCode403,
	"EMAIL_NOT_VERIFIED",
	"ALREADY_LOGGED_IN",
] as const;
export type ServerCode403 = (typeof serverCode403)[number];

export const providerCode403 = [
	...commonCode403,
	"NOT_A_MEMBER",
	"MEMBER_REVOKED",
] as const;
export type ProviderCode403 = (typeof providerCode403)[number];

export const commonCode404 = ["NOT_FOUND"] as const;
export type CommonCode404 = (typeof commonCode404)[number];

export const commonCode409 = ["CONFLICT"] as const;
export type CommonCode409 = (typeof commonCode409)[number];

export const providerCode409 = [
	...commonCode409,
	"ALREADY_MEMBER",
	"ALREADY_PENDING",
	"ALREADY_DECIDED",
] as const;
export type ProviderCode409 = (typeof providerCode409)[number];

export const commonCode413 = ["PAYLOAD_TOO_LARGE"] as const;
export type CommonCode413 = (typeof commonCode413)[number];

export const commonCode415 = ["UNSUPPORTED_MEDIA_TYPE"] as const;
export type CommonCode415 = (typeof commonCode415)[number];

export const commonCode429 = [
	"RATE_LIMITED",
	"TOO_MANY_LOGIN_ATTEMPTS",
	"TOO_MANY_UPLOADS",
	"TOO_MANY_REGISTRATIONS",
] as const;
export type CommonCode429 = (typeof commonCode429)[number];

export interface ErrorScope {
	401: readonly string[];
	403: readonly string[];
	409: readonly string[];
}

export const serverErrorScope: ErrorScope = {
	401: serverCode401,
	403: serverCode403,
	409: commonCode409,
};

export const providerErrorScope: ErrorScope = {
	401: providerCode401,
	403: providerCode403,
	409: providerCode409,
};
