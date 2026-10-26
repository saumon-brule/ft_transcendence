export const MEDIA_TYPES = ["audio", "musicCover", "albumCover", "artistAvatar"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export const MEDIA_ROUTES = {
	"audio": "/music/:uuid/audio",
	"musicCover": "/music/:uuid/cover",
	"albumCover": "/album/:uuid/cover",
	"artistAvatar": "/artist/:uuid/avatar",
} as const satisfies Record<MediaType, string>;

export function buildMediaUrl(baseUrl: string, type: MediaType, uuid: string, token: string) {
	const path = MEDIA_ROUTES[type].replace(":uuid", uuid);
	return `${baseUrl.replace(/\/+$/, "")}${path}?token=${encodeURIComponent(token)}`;
}
