import { initContract } from "@ts-rest/core";
import { uuidParamSchema } from "../../../schemas/common.schema";
import { createdPlaylistSchema, createPlaylistBodySchema, MusicBodySchema, updatePlaylistNameSchema, updatePlaylistPrivacySchema } from "./schemas/playlist.schema";
import { commonError404Schema } from "../../../errors/error-schemas";

const c = initContract();

export const playlistsContract = c.router(
	{
		createPlaylist: {
			method: "POST",
			path: "/",
			body: createPlaylistBodySchema,
			responses: {
				201: createdPlaylistSchema,
			},
		},
		updatePlaylistName: {
			method: "PATCH",
			path: "/:uuid",
			pathParams: uuidParamSchema,
			body: updatePlaylistNameSchema,
			responses: {
				204: null,
				404: commonError404Schema,
			},
		},
		setPlaylistPrivacy: {
			method: "PATCH",
			path: "/:uuid/privacy",
			pathParams: uuidParamSchema,
			body: updatePlaylistPrivacySchema,
			responses: {
				204: null,
				404: commonError404Schema,
			},
		},
		deletePlaylist: {
			method: "DELETE",
			path: "/:uuid",
			pathParams: uuidParamSchema,
			responses: {
				204: null,
				404: commonError404Schema,
			},
		},
		addMusicToPlaylist: {
			method: "POST",
			path: "/:uuid/musics",
			pathParams: uuidParamSchema,
			body: MusicBodySchema,
			responses: {
				204: null,
				404: commonError404Schema,
			},
		},
		removeMusicFromPlaylist: {
			method: "DELETE",
			path: "/:uuid/musics",
			pathParams: uuidParamSchema,
			body: MusicBodySchema,
			responses: {
				204: null,
				404: commonError404Schema,
			},
		},
		uploadCover: {
			method: "PATCH",
			path: "/:uuid/cover",
			pathParams: uuidParamSchema,
			contentType: "multipart/form-data",
			body: c.type<{ cover: File }>(),
			responses: {
				204: null,
			},
		},
		followPlaylist: {
			method: "POST",
			path: "/playlists/:uuid/follow",
			pathParams: uuidParamSchema,
			body: c.noBody(),
			responses: { 204: null },
		},
		unfollowPlaylist: {
			method: "POST",
			path: "/playlists/:uuid/unfollow",
			pathParams: uuidParamSchema,
			body: c.noBody(),
			responses: { 204: null },
		},
	},
	{ pathPrefix: "/playlists" },
);
