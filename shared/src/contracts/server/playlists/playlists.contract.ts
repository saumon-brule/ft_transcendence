import { initContract } from "@ts-rest/core";
import { uuidParamSchema } from "../../../schemas/common.schema";
import { createdPlaylistSchema, createPlaylistBodySchema, musicPathParamsSchema } from "./schemas/playlist.schema";
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
		addMusicToPlaylist: {
			method: "POST",
			path: "/:uuid/musics/:musicUUID",
			pathParams: musicPathParamsSchema,
			responses: {
				204: null,
				404: commonError404Schema,
			},
		},
		removeMusicFromPlaylist: {
			method: "DELETE",
			path: "/:uuid/musics/:musicUUID",
			pathParams: musicPathParamsSchema,
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
	},
	{ pathPrefix: "/playlists" },
);
