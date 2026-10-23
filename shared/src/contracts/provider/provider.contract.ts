import { initContract } from "@ts-rest/core";
import { infoContract } from "./info/info.contract";
import { accessRequestContract } from "./accessRequest/access-request.contract";
import { providerMemberContract } from "./member/member.contract";
import { providerRoleContract } from "./role/role.contract";
import { settingContract } from "./setting/setting.contract";
import { musicContract } from "./music/music.contract";
import { artistContract } from "./artist/artist.contract";
import { albumContract } from "./album/album.contract";
import { mediaContract } from "./media/media.contract";
import { commonError400Schema, commonError429Schema, providerError401Schema, providerError403Schema } from "../../errors/error-schemas";

const c = initContract();

export const providerContract = c.router(
	{
		info: infoContract,
		accessRequest: accessRequestContract,
		member: providerMemberContract,
		role: providerRoleContract,
		setting: settingContract,
		music: musicContract,
		artist: artistContract,
		album: albumContract,
		media: mediaContract,
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
