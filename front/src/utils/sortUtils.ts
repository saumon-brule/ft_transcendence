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
