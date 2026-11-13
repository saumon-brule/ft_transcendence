import { createMutation, createQuery, useQueryClient } from "@tanstack/solid-query";
import type { ClientInferResponses } from "@ts-rest/core";
import { serverContract, type PlaylistListDto } from "@flex/shared";
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

type MeResponse = ClientInferResponses<typeof serverContract.users.me, 200>;

export const useCreatePlaylist = () => {
	const queryClient = useQueryClient();

	return createMutation({
		mutationFn: async (body: { name: string; private: boolean }) => {
			const res = await client.playlists.createPlaylist.mutation({ body });
			if (res.status !== 201) throw new PlaylistRequestError(res.status);
			return res.body;
		},
		onSuccess: (created) => {
			const me = queryClient.getQueryData<MeResponse>(queryKeys.users.me());

			queryClient.setQueryData<PlaylistListDto>(queryKeys.playlists.listPlaylists(), (old) => {
				if (!old || !me) return old;
				return {
					...old,
					owned: [...old.owned, {
						...created,
						createdAt: new Date(),
						owner: { uuid: me.body.uuid, username: me.body.username },
						musicCount: 0,
					}],
				};
			});

			queryClient.setQueryData<MeResponse>(queryKeys.users.me(), (old) => {
				if (!old) return old;
				return {
					...old,
					body: {
						...old.body,
						ownedPlaylists: [...old.body.ownedPlaylists, { ...created, _count: { musics: 0 } }],
						_count: { ...old.body._count, ownedPlaylists: old.body._count.ownedPlaylists + 1 },
					},
				};
			});
		},
		onError: () => { summonErrorToast("Failed to create the playlist"); },
	});
};
