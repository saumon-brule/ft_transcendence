import { initContract } from "@ts-rest/core";
import { musicContract } from "./music/music.contract";
import { artistContract } from "./artist/artist.contract";
import { albumContract } from "./album/album.contract";

const c = initContract();

export const providerContract = c.router(
	{
		music: musicContract,
		artist: artistContract,
		album: albumContract,
	},
);
