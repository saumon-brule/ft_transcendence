import { initContract } from "@ts-rest/core";
import { meSchema } from "../users/schemas/user.schema";
import { commonError404Schema, commonError409Schema, commonError429Schema, serverBaseError401Schema } from "../../../errors/error-schemas";
import { createdPlaylistSchema, createPlaylistBodySchema, MusicBodySchema, overwritePlaylistBodySchema, playlistListSchema, updatePlaylistNameSchema, updatePlaylistPrivacySchema } from "../playlists/schemas/playlist.schema";
import { uuidParamSchema } from "../../../schemas/common.schema";

const c = initContract();

export const API_MAX_USAGE_PER_HOUR = 1200;
export const API_MAX_USAGE_PER_SECOND = 2;

export const apiContract = c.router(
	{
		me: {
			method: "GET",
			path: "/me",
			responses: { 200: meSchema },
		},
		listPlaylists: {
			method: "GET",
			path: "/playlist",
			responses: {
				200: playlistListSchema,
				404: commonError404Schema,
			},
		},
		createPlaylist: {
			method: "POST",
			path: "/playlist",
			body: createPlaylistBodySchema,
			responses: {
				201: createdPlaylistSchema,
			},
		},
		deletePlaylist: {
			method: "DELETE",
			path: "/playlist/:uuid",
			pathParams: uuidParamSchema,
			responses: {
				204: null,
				404: commonError404Schema,
			},
		},
		updatePlaylistName: {
			method: "PATCH",
			path: "/playlist/:uuid",
			pathParams: uuidParamSchema,
			body: updatePlaylistNameSchema,
			responses: {
				204: null,
				404: commonError404Schema,
			},
		},
		setPlaylistPrivacy: {
			method: "PATCH",
			path: "/playlist/:uuid/privacy",
			pathParams: uuidParamSchema,
			body: updatePlaylistPrivacySchema,
			responses: {
				204: null,
				404: commonError404Schema,
			},
		},
		addMusicToPlaylist: {
			method: "POST",
			path: "/playlist/:uuid/musics",
			pathParams: uuidParamSchema,
			body: MusicBodySchema,
			responses: {
				204: null,
				404: commonError404Schema,
				409: commonError409Schema,
			},
		},
		removeMusicFromPlaylist: {
			method: "DELETE",
			path: "/playlist/:uuid/musics",
			pathParams: uuidParamSchema,
			body: MusicBodySchema,
			responses: {
				204: null,
				404: commonError404Schema,
			},
		},
		overwritePlaylist: {
			method: "PUT",
			path: "/playlist/:uuid/musics",
			pathParams: uuidParamSchema,
			body: overwritePlaylistBodySchema,
			responses: {
				204: null,
				404: commonError404Schema,
			},
		},
	},
	{
		pathPrefix: "/api",
		commonResponses: {
			401: serverBaseError401Schema,
			429: commonError429Schema,
		},
	},
);
