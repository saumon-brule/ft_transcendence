import { Prisma } from "../../generated/prisma/client";

export const musicItemInclude = {
	album: true,
	artists: { include: { artist: true }, orderBy: { artist: { name: "asc" } } },
} satisfies Prisma.MusicInclude;

export const musicDetailInclude = {
	...musicItemInclude,
	addedBy: true,
} satisfies Prisma.MusicInclude;

export const artistDetailInclude = {
	addedBy: true,
	music: {
		include: { music: { include: musicItemInclude } },
		orderBy: { music: { name: "asc" } },
	},
	albums: { include: { album: true }, orderBy: { album: { name: "asc" } } },
} satisfies Prisma.ArtistInclude;

export const albumDetailInclude = {
	addedBy: true,
	musics: { include: musicItemInclude, orderBy: { name: "asc" } },
	artists: { include: { artist: true }, orderBy: { artist: { name: "asc" } } },
} satisfies Prisma.AlbumInclude;

export type MusicItemRow = Prisma.MusicGetPayload<{ include: typeof musicItemInclude }>;
export type MusicDetailRow = Prisma.MusicGetPayload<{ include: typeof musicDetailInclude }>;
export type ArtistDetailRow = Prisma.ArtistGetPayload<{ include: typeof artistDetailInclude }>;
export type AlbumDetailRow = Prisma.AlbumGetPayload<{ include: typeof albumDetailInclude }>;

export const toArtistItem = (artist: { uuid: string; name: string; hasAvatar: boolean }) => ({
	uuid: artist.uuid,
	name: artist.name,
	hasAvatar: artist.hasAvatar,
});

export const toAlbumItem = (album: { uuid: string; name: string; publishedAt: Date | null; hasCover: boolean }) => ({
	uuid: album.uuid,
	name: album.name,
	publishedAt: album.publishedAt,
	hasCover: album.hasCover,
});

export const toMusicItem = (music: MusicItemRow) => ({
	uuid: music.uuid,
	name: music.name,
	duration: music.duration,
	publishedAt: music.publishedAt,
	hasCover: music.hasCover,
	artists: music.artists.map((link) => toArtistItem(link.artist)),
	album: music.album
		? toAlbumItem(music.album)
		: null,
});

export const toMusicDetail = (music: MusicDetailRow) => ({
	...toMusicItem(music),
	addedBy: music.addedBy?.uuid ?? null,
	addedAt: music.createdAt,
});

export const toArtistDetail = (artist: ArtistDetailRow) => ({
	uuid: artist.uuid,
	name: artist.name,
	addedBy: artist.addedBy?.uuid ?? null,
	addedAt: artist.createdAt,
	biography: artist.biography,
	hasAvatar: artist.hasAvatar,
	musics: artist.music.map((link) => toMusicItem(link.music)),
	albums: artist.albums.map((link) => toAlbumItem(link.album)),
});

export const toAlbumDetail = (album: AlbumDetailRow) => ({
	uuid: album.uuid,
	name: album.name,
	addedBy: album.addedBy?.uuid ?? null,
	addedAt: album.createdAt,
	publishedAt: album.publishedAt,
	hasCover: album.hasCover,
	musics: album.musics.map(toMusicItem),
	artists: album.artists.map((link) => toArtistItem(link.artist)),
});
