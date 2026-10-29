import { Prisma } from "../../generated/prisma/client";

export const albumItemInclude = {
	artists: { include: { artist: true }, orderBy: { artist: { name: "asc" } } },
} satisfies Prisma.AlbumInclude;

export const musicItemInclude = {
	album: { include: albumItemInclude },
	artists: { include: { artist: true }, orderBy: { artist: { name: "asc" } } },
} satisfies Prisma.MusicInclude;

export const musicDetailInclude = {
	...musicItemInclude,
	addedBy: true,
} satisfies Prisma.MusicInclude;

// Les details d'artiste/album ne renvoient que la premiere page de musiques, le reste passe par la pagination
export const DETAIL_MUSIC_LIMIT = 20;

export const artistDetailInclude = {
	addedBy: true,
	music: {
		include: { music: { include: musicItemInclude } },
		orderBy: { music: { name: "asc" } },
		take: DETAIL_MUSIC_LIMIT,
	},
	_count: { select: { music: true, albums: true } },
	albums: { include: { album: { include: albumItemInclude } }, orderBy: { album: { name: "asc" } } },
} satisfies Prisma.ArtistInclude;

export const albumDetailInclude = {
	addedBy: true,
	musics: { include: musicItemInclude, orderBy: { name: "asc" }, take: DETAIL_MUSIC_LIMIT },
	_count: { select: { musics: true } },
	artists: { include: { artist: true }, orderBy: { artist: { name: "asc" } } },
} satisfies Prisma.AlbumInclude;

export type AlbumItemRow = Prisma.AlbumGetPayload<{ include: typeof albumItemInclude }>;
export type MusicItemRow = Prisma.MusicGetPayload<{ include: typeof musicItemInclude }>;
export type MusicDetailRow = Prisma.MusicGetPayload<{ include: typeof musicDetailInclude }>;
export type ArtistDetailRow = Prisma.ArtistGetPayload<{ include: typeof artistDetailInclude }>;
export type AlbumDetailRow = Prisma.AlbumGetPayload<{ include: typeof albumDetailInclude }>;

export const toArtistItem = (artist: { uuid: string; name: string; hasAvatar: boolean }) => ({
	uuid: artist.uuid,
	name: artist.name,
	hasAvatar: artist.hasAvatar,
});

export const toAlbumItem = (album: AlbumItemRow) => ({
	uuid: album.uuid,
	name: album.name,
	publishedAt: album.publishedAt,
	hasCover: album.hasCover,
	artists: album.artists.map((link) => toArtistItem(link.artist)),
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
	music: { musics: artist.music.map((link) => toMusicItem(link.music)), total: artist._count.music },
	album: { albums: artist.albums.map((link) => toAlbumItem(link.album)), total: artist._count.albums },
});

export const toAlbumDetail = (album: AlbumDetailRow) => ({
	uuid: album.uuid,
	name: album.name,
	addedBy: album.addedBy?.uuid ?? null,
	addedAt: album.createdAt,
	publishedAt: album.publishedAt,
	hasCover: album.hasCover,
	music: { musics: album.musics.map(toMusicItem), total: album._count.musics },
	artists: album.artists.map((link) => toArtistItem(link.artist)),
});
