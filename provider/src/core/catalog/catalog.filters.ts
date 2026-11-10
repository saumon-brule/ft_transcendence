import { Prisma } from "../../generated/prisma/client";

interface Dates {
	dateBefore?: Date;
	dateAfter?: Date;
}

export interface MusicFilters extends Dates {
	name?: string;
	artist?: string;
	album?: string;
	artistUuid?: string;
	albumUuid?: string;
}

export interface AlbumFilters extends Dates {
	name?: string;
	artist?: string;
	artistUuid?: string;
}

export interface ArtistFilters {
	name?: string;
}

export interface CatalogFilters {
	Music: MusicFilters;
	Album: AlbumFilters;
	Artist: ArtistFilters;
}

const sameText = (column: string, value: string) => Prisma.sql`lower(${Prisma.raw(column)}) = lower(${value})`;

const hasArtist = (link: string, ownerTable: string, ownerKey: string, name: string) => Prisma.sql`EXISTS (
	SELECT 1 FROM ${Prisma.raw(link)} AS "link"
	JOIN "Artist" AS "artist" ON "artist"."uuid" = "link"."artistUuid"
	WHERE "link".${Prisma.raw(ownerKey)} = ${Prisma.raw(ownerTable)}."uuid" AND lower("artist"."name") = lower(${name})
)`;

const hasArtistUuid = (link: string, ownerTable: string, ownerKey: string, artistUuid: string) => Prisma.sql`EXISTS (
	SELECT 1 FROM ${Prisma.raw(link)} AS "link"
	WHERE "link".${Prisma.raw(ownerKey)} = ${Prisma.raw(ownerTable)}."uuid" AND lower("link"."artistUuid") = lower(${artistUuid})
)`;

const published = ({ dateBefore, dateAfter }: Dates) => [
	...dateAfter
		? [Prisma.sql`"publishedAt" >= ${dateAfter}`]
		: [],
	...dateBefore
		? [Prisma.sql`"publishedAt" <= ${dateBefore}`]
		: [],
];

export const FILTER_CONDITIONS: { [T in keyof CatalogFilters]: (filters: CatalogFilters[T]) => Prisma.Sql[] } = {
	Music: ({ name, artist, album, artistUuid, albumUuid, ...dates }) => [
		...name
			? [sameText("\"Music\".\"name\"", name)]
			: [],
		...artist
			? [hasArtist("\"MusicArtist\"", "\"Music\"", "\"musicUuid\"", artist)]
			: [],
		...artistUuid
			? [hasArtistUuid("\"MusicArtist\"", "\"Music\"", "\"musicUuid\"", artistUuid)]
			: [],
		...albumUuid
			? [sameText("\"Music\".\"albumUuid\"", albumUuid)]
			: [],
		...album
			? [Prisma.sql`EXISTS (SELECT 1 FROM "Album" AS "album" WHERE "album"."uuid" = "Music"."albumUuid" AND lower("album"."name") = lower(${album}))`]
			: [],
		...published(dates),
	],
	Album: ({ name, artist, artistUuid, ...dates }) => [
		...name
			? [sameText("\"Album\".\"name\"", name)]
			: [],
		...artist
			? [hasArtist("\"AlbumArtist\"", "\"Album\"", "\"albumUuid\"", artist)]
			: [],
		...artistUuid
			? [hasArtistUuid("\"AlbumArtist\"", "\"Album\"", "\"albumUuid\"", artistUuid)]
			: [],
		...published(dates),
	],
	Artist: ({ name }) => [
		...name
			? [sameText("\"Artist\".\"name\"", name)]
			: [],
	],
};
