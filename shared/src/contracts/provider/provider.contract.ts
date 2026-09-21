import { initContract } from "@ts-rest/core";
import { infoContract } from "./info/info.contract";
import { accessRequestsContract } from "./accessRequests/access-requests.contract";
import { providerMembersContract } from "./members/members.contract";
import { providerRolesContract } from "./roles/roles.contract";
import { settingsContract } from "./settings/settings.contract";
import { musicContract } from "./music/music.contract";
import { artistContract } from "./artist/artist.contract";
import { albumContract } from "./album/album.contract";
import { error403ProviderSchema } from "../schemas/error403";
import { error400Schema } from "../schemas/error400";
import { error401BaseSchema } from "../schemas/error401";
import { error429Schema } from "../schemas/error429";

const c = initContract();

export const providerContract = c.router(
	{
		info: infoContract,
		accessRequests: accessRequestsContract,
		members: providerMembersContract,
		roles: providerRolesContract,
		settings: settingsContract,
		music: musicContract,
		artist: artistContract,
		album: albumContract,
	},
	{
		commonResponses: {
			400: error400Schema,
			401: error401BaseSchema,
			403: error403ProviderSchema,
			429: error429Schema,
		},
	},
);
