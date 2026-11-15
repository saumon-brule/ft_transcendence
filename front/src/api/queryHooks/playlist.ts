import { useQueryClient } from "@tanstack/solid-query";
import type { ClientInferResponses } from "@ts-rest/core";
import { serverContract } from "@flex/shared";
import { client, queryKeys } from "../client";
import { summonErrorToast, summonSuccessToast } from "~/components/ui/Toaster";

export class PlaylistRequestError extends Error {
	constructor(public readonly status: number) {
		super(`Playlist request failed with status ${status}`);
	}
}

export const usePlaylistQuery = (uuid: () => string) => client.playlists.getPlaylist.createQuery(
	() => queryKeys.playlists.getPlaylist([uuid()]),
	{ params: { get uuid() { return uuid(); } } },
	{
		retry: (count, error) => !(error instanceof PlaylistRequestError) && count < 2,
		staleTime: 30_000,
	},
);

type ListPlaylistsResponse = ClientInferResponses<typeof serverContract.playlists.listPlaylists, 200>;
type GetPlaylistResponse = ClientInferResponses<typeof serverContract.playlists.getPlaylist, 200>;

export const useRemoveMusicFromPlaylistMutation = () => {
	const queryClient = useQueryClient();

	return client.playlists.removeMusicFromPlaylist.createMutation({
		onSuccess: (_, vars) => {
			const playlistUuid = vars.params.uuid;
			const { musicUUID, providerUUID } = vars.body;

			queryClient.setQueryData<GetPlaylistResponse>(queryKeys.playlists.getPlaylist([playlistUuid]), (old) => {
				if (!old) return old;
				return { ...old,
					body: { ...old.body,
						musics: old.body.musics.filter((music) => !(music.musicUuid === musicUUID && music.providerUuid === providerUUID)) } };
			});

			queryClient.setQueryData<ListPlaylistsResponse>(queryKeys.playlists.listPlaylists(), (old) => {
				if (!old) return old;
				return { ...old,
					body: { ...old.body,
						owned: old.body.owned.map((playlist) => playlist.uuid === playlistUuid
							? { ...playlist, musicCount: playlist.musicCount - 1 }
							: playlist) } };
			});

			queryClient.setQueryData<MeResponse>(queryKeys.users.me(), (old) => {
				if (!old) return old;
				return { ...old,
					body: { ...old.body,
						ownedPlaylists: old.body.ownedPlaylists.map((playlist) => playlist.uuid === playlistUuid
							? { ...playlist, _count: { ...playlist._count, musics: playlist._count.musics - 1 } }
							: playlist) } };
			});
		},
		onError: (e) => {
			if (e.status === 404) summonErrorToast("Music isn't in this playlist");
			else summonErrorToast("Failed to remove the music from the playlist");
		},
	});
};

export const useAddMusicToPlaylistMutation = () => {
	const queryClient = useQueryClient();
	return client.playlists.addMusicToPlaylist.createMutation({
		onSuccess: (_, vars) => {
			const playlistUuid = vars.params.uuid;

			void queryClient.invalidateQueries({ queryKey: queryKeys.playlists.getPlaylist([playlistUuid]) });

			queryClient.setQueryData<ListPlaylistsResponse>(queryKeys.playlists.listPlaylists(), (old) => {
				if (!old) return old;
				return { ...old,
					body: { ...old.body,
						owned: old.body.owned.map((playlist) => playlist.uuid === playlistUuid
							? { ...playlist, musicCount: playlist.musicCount + 1 }
							: playlist) } };
			});

			queryClient.setQueryData<MeResponse>(queryKeys.users.me(), (old) => {
				if (!old) return old;
				return { ...old,
					body: { ...old.body,
						ownedPlaylists: old.body.ownedPlaylists.map((playlist) => playlist.uuid === playlistUuid
							? { ...playlist, _count: { ...playlist._count, musics: playlist._count.musics + 1 } }
							: playlist) } };
			});
			summonSuccessToast("Music added to the playlist");
		},
		onError: (error) => {
			if (error.status === 409) summonErrorToast("This music is already in the playlist");
			else summonErrorToast("Failed to add the music to the playlist");
		},
	});
};

export const usePlaylistsQuery = () => client.playlists.listPlaylists.createQuery(() => queryKeys.playlists.listPlaylists(), {}, { staleTime: 30_000 });

type MeResponse = ClientInferResponses<typeof serverContract.users.me, 200>;

export const useCreatePlaylistMutation = () => {
	const queryClient = useQueryClient();

	return client.playlists.createPlaylist.createMutation({
		onSuccess: (response) => {
			const me = queryClient.getQueryData<MeResponse>(queryKeys.users.me());

			queryClient.setQueryData<ListPlaylistsResponse>(queryKeys.playlists.listPlaylists(), (old) => {
				if (!old || !me) return old;
				return { ...old,
					body: { ...old.body,
						owned: [...old.body.owned, {
							...response.body,
							createdAt: new Date(),
							owner: { uuid: me.body.uuid, username: me.body.username },
							musicCount: 0,
						}] } };
			});

			queryClient.setQueryData<MeResponse>(queryKeys.users.me(), (old) => {
				if (!old) return old;
				return { ...old,
					body: { ...old.body,
						ownedPlaylists: [...old.body.ownedPlaylists, { ...response.body, _count: { musics: 0 } }],
						_count: { ...old.body._count, ownedPlaylists: old.body._count.ownedPlaylists + 1 } } };
			});
		},
		onError: () => { summonErrorToast("Failed to create the playlist"); },
	});
};
