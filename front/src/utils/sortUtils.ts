import type { SearchSortField, SortOrder } from "@flex/shared";
import { Album } from "~/class/Album";
import { Artist } from "~/class/Artist";
import { Music } from "~/class/Music";

const normalize = (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const tokensOf = (value: string) => value.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
const MIN_FUZZY_LENGTH = 3;
const POINTS_EXACT = 1.0;
const POINTS_PREFIX = 0.8;
const POINTS_FUZZY = 0.5;

const BONUS_TITLE_MATCH = 5;
const BONUS_TITLE_STARTS_WITH = 2;
const BONUS_COVERING = 1;
const MALUS_WORD_NOT_FOUND = -1;

function withinOneEdit(a: string, b: string) {
	if (Math.abs(a.length - b.length) > 1) return false;
	let i = 0;
	let j = 0;
	let edits = 0;
	while (i < a.length && j < b.length) {
		if (a[i] === b[j]) {
			i++;
			j++;
			continue;
		}
		if (++edits > 1) return false;
		if (a.length >= b.length) i++;
		if (a.length <= b.length) j++;
	}
	return edits + (a.length - i) + (b.length - j) <= 1;
}

function tokenPoints(queryToken: string, fieldTokens: string[]) {
	let best = 0;
	for (const token of fieldTokens) {
		if (token === queryToken) return POINTS_EXACT;
		if (token.startsWith(queryToken)) best = Math.max(best, POINTS_PREFIX);
		else if (queryToken.length >= MIN_FUZZY_LENGTH && withinOneEdit(queryToken, token)) best = Math.max(best, POINTS_FUZZY);
	}
	return best;
}

function scoreFields(title: string, fields: { value: string; boost: number }[], query: string) {
	const queryTokens = tokensOf(normalize(query));
	if (queryTokens.length === 0) return 0;
	const tokenized = fields.map(({ value, boost }) => ({ tokens: tokensOf(normalize(value)), boost }));

	let score = 0;
	let found = 0;
	for (const queryToken of queryTokens) {
		const best = Math.max(...tokenized.map(({ tokens, boost }) => tokenPoints(queryToken, tokens) * boost));
		if (best > 0) found++;
		else score += MALUS_WORD_NOT_FOUND;
		score += best;
	}

	const normalizedTitle = tokensOf(normalize(title)).join(" ");
	const normalizedQuery = queryTokens.join(" ");
	if (normalizedTitle === normalizedQuery) score += BONUS_TITLE_MATCH;
	else if (normalizedTitle.startsWith(normalizedQuery)) score += BONUS_TITLE_STARTS_WITH;
	if (found === queryTokens.length) score += BONUS_COVERING;

	return score;
}


export function scoreMusic(music: Music, query: string) {
	return scoreFields(music.name, [
		{ value: music.name, boost: 3 },
		{ value: music.artists.map((artist) => artist.name).join(" "), boost: 2 },
		{ value: music.album?.name ?? "", boost: 1 },
	], query);
}

export function scoreAlbum(album: Album, query: string) {
	return scoreFields(album.name, [
		{ value: album.name, boost: 3 },
		{ value: album.artists.map((artist) => artist.name).join(" "), boost: 2 },
	], query);
}

export function scoreArtist(artist: Artist, query: string) {
	return scoreFields(artist.name, [
		{ value: artist.name, boost: 1 },
	], query);
}

export function sortByScore<T>(items: T[], score: (item: T) => number) {
	return items.map((item) => ({ item, score: score(item) }))
		.sort((a, b) => b.score - a.score)
		.map(({ item }) => item);
}

type Sorting = { field: SearchSortField; order: SortOrder };

function compareValues(a: string | number | null, b: string | number | null, order: SortOrder) {
	const missing = (value: string | number | null) => value === null || value === "";
	if (missing(a) || missing(b)) return Number(missing(a)) - Number(missing(b));

	const result = typeof a === "string" && typeof b === "string"
		? a.localeCompare(b, undefined, { sensitivity: "base" })
		: Number(a) - Number(b);
	return order === "desc"
		? -result
		: result;
}

const timeOf = (date: Date | string | null) => date === null
	? null
	: new Date(date).getTime();
const namesOf = (artists: { name: string }[]) => artists.map((artist) => artist.name).join(", ");

export function compareMusics(a: Music, b: Music, { field, order }: Sorting) {
	switch (field) {
		case "name": return compareValues(a.name, b.name, order);
		case "artist": return compareValues(namesOf(a.artists), namesOf(b.artists), order);
		case "album": return compareValues(a.album?.name ?? null, b.album?.name ?? null, order);
		case "published": return compareValues(timeOf(a.publishedAt), timeOf(b.publishedAt), order);
		case "duration": return compareValues(a.duration, b.duration, order);
	}
}

export function compareAlbums(a: Album, b: Album, { field, order }: Sorting) {
	switch (field) {
		case "name": return compareValues(a.name, b.name, order);
		case "artist": return compareValues(namesOf(a.artists), namesOf(b.artists), order);
		case "published": return compareValues(timeOf(a.publishedAt), timeOf(b.publishedAt), order);
		default: return 0;
	}
}

export function compareArtists(a: Artist, b: Artist, { field, order }: Sorting) {
	return field === "name"
		? compareValues(a.name, b.name, order)
		: 0;
}
