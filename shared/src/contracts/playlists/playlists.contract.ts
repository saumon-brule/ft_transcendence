import { initContract } from "@ts-rest/core";
import { uuidParamSchema } from "../schemas/common.schema";

const c = initContract();

export const playlistsContract = c.router(
	{
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
