export const MEDIA_ROUTES = {
	"audio": "/music/:uuid/audio",
	"musicCover": "/music/:uuid/cover",
	"albumCover": "/album/:uuid/cover",
	"artistAvatar": "/artist/:uuid/avatar",
} as const;

export type MediaType = keyof typeof MEDIA_ROUTES;

export function buildMediaUrl(baseUrl: string, type: MediaType, uuid: string, token: string) {
	const path = MEDIA_ROUTES[type].replace(":uuid", uuid);
	return `${baseUrl.replace(/\/+$/, "")}${path}?token=${encodeURIComponent(token)}`;
}
