import { client, queryKeys } from "../client";

/** Searches only run while their tab is shown and the search term is not empty. */
const searchOptions = (term: () => string, enabled: () => boolean) => ({
	get enabled() { return enabled() && term() !== ""; },
	staleTime: 30_000,
	keepPreviousData: true,
});

export const useSearchUsersQuery = (term: () => string, enabled: () => boolean) => client.users.searchUsers.createQuery(
	() => queryKeys.users.searchUsers([term()]),
	{ query: { get username() { return term(); } } },
	searchOptions(term, enabled),
);

export const useSearchPlaylistsQuery = (term: () => string, enabled: () => boolean) => client.playlists.searchPlaylists.createQuery(
	() => queryKeys.playlists.searchPlaylists([term()]),
	{ query: { get name() { return term(); } } },
	searchOptions(term, enabled),
);

export const useSearchProvidersQuery = (term: () => string, enabled: () => boolean) => client.providers.search.createQuery(
	() => queryKeys.providers.search([term()]),
	{ query: { get name() { return term(); } } },
	searchOptions(term, enabled),
);
