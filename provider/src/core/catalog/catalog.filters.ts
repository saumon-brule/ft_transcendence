import { Prisma } from "../../generated/prisma/client";

interface Dates {
	dateBefore?: Date;
	dateAfter?: Date;
}

export interface MusicFilters extends Dates {
	name?: string;
	artist?: string;
	album?: string;
}

export interface AlbumFilters extends Dates {
	name?: string;
	artist?: string;
}

export interface ArtistFilters {
	name?: string;
}

const exactly = (value: string) => ({ equals: value, mode: "insensitive" as const });

const published = ({ dateBefore, dateAfter }: Dates) => (dateBefore || dateAfter
	? { publishedAt: { lte: dateBefore, gte: dateAfter } }
	: undefined);

const clauses = <T>(...parts: (T | undefined)[]) => {
	const defined = parts.filter((part): part is T => part !== undefined);
	return defined.length > 0
		? { AND: defined }
		: undefined;
};

export const musicWhere = (filters: MusicFilters): Prisma.MusicWhereInput | undefined => clauses<Prisma.MusicWhereInput>(
	filters.name
		? { name: exactly(filters.name) }
		: undefined,
	filters.artist
		? { artists: { some: { artist: { name: exactly(filters.artist) } } } }
		: undefined,
	filters.album
		? { album: { is: { name: exactly(filters.album) } } }
		: undefined,
	published(filters),
);

export const albumWhere = (filters: AlbumFilters): Prisma.AlbumWhereInput | undefined => clauses<Prisma.AlbumWhereInput>(
	filters.name
		? { name: exactly(filters.name) }
		: undefined,
	filters.artist
		? { artists: { some: { artist: { name: exactly(filters.artist) } } } }
		: undefined,
	published(filters),
);

export const artistWhere = (filters: ArtistFilters): Prisma.ArtistWhereInput | undefined => clauses<Prisma.ArtistWhereInput>(
	filters.name
		? { name: exactly(filters.name) }
		: undefined,
);
