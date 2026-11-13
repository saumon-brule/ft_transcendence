import { createMutation, createQuery, useQueryClient } from "@tanstack/solid-query";
import { client, queryKeys } from "../client";
import { summonErrorToast } from "~/components/ui/Toaster";

export class PlaylistRequestError extends Error {
	constructor(public readonly status: number) {
		super(`Playlist request failed with status ${status}`);
	}
}

export const usePlaylistQuery = (uuid: () => string) => createQuery({
	queryKey: () => queryKeys.playlists.getPlaylist([uuid()]),
	queryFn: async () => {
		const res = await client.playlists.getPlaylist.query({ params: { uuid: uuid() } });
		if (res.status !== 200) throw new PlaylistRequestError(res.status);
		return res.body;
	},
	retry: (count, error) => !(error instanceof PlaylistRequestError) && count < 2,
	staleTime: 30_000,
});

export const useRemoveMusicFromPlaylist = (playlistUuid: () => string) => {
	const queryClient = useQueryClient();

	return createMutation({
		mutationFn: async (track: { musicUuid: string; providerUuid: string }) => {
			const res = await client.playlists.removeMusicFromPlaylist.mutation({
				params: { uuid: playlistUuid() },
				body: { musicUUID: track.musicUuid, providerUUID: track.providerUuid },
			});
			if (res.status !== 204) throw new PlaylistRequestError(res.status);
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.playlists.getPlaylist([playlistUuid()]) }),
		onError: () => { summonErrorToast("Failed to remove the music from the playlist"); },
	});
};

export const usePlaylistsQuery = () => createQuery({
	queryKey: () => queryKeys.playlists.listPlaylists(),
	queryFn: async () => {
		const res = await client.playlists.listPlaylists.query();
		if (res.status !== 200) throw new PlaylistRequestError(res.status);
		return res.body;
	},
	staleTime: 30_000,
});

export const useCreatePlaylist = () => {
	const queryClient = useQueryClient();

	return createMutation({
		mutationFn: async (body: { name: string; private: boolean }) => {
			const res = await client.playlists.createPlaylist.mutation({ body });
			if (res.status !== 201) throw new PlaylistRequestError(res.status);
			return res.body;
		},
		onSuccess: () => Promise.all([
			queryClient.invalidateQueries({ queryKey: queryKeys.playlists.listPlaylists() }),
			queryClient.invalidateQueries({ queryKey: queryKeys.users.me() }),
		]),
		onError: () => { summonErrorToast("Failed to create the playlist"); },
	});
};
