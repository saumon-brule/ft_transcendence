import { initContract } from "@ts-rest/core";
import { infoContract } from "./info/info.contract";
import { accessRequestsContract } from "./accessRequests/access-requests.contract";
import { providerMembersContract } from "./members/members.contract";
import { providerRolesContract } from "./roles/roles.contract";
import { settingsContract } from "./settings/settings.contract";
import { musicContract } from "./music/music.contract";
import { artistContract } from "./artist/artist.contract";
import { albumContract } from "./album/album.contract";
import { commonError400Schema, commonError429Schema, providerError401Schema, providerError403Schema } from "../../errors/error-schemas";

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
			400: commonError400Schema,
			401: providerError401Schema,
			403: providerError403Schema,
			429: commonError429Schema,
		},
	},
);
