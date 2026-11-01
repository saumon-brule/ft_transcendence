import { z } from "zod";
import { visibilitySchema } from "../../setting/schemas/setting.schema";
import { musicListResponseSchema } from "../../music/schemas/music.schema";
import { albumListResponseSchema } from "../../album/schemas/album.schema";
import { artistListResponseSchema } from "../../artist/schemas/artist.schema";

export const providerPublicInfoSchema = z.object({
	uuid: z.string().uuid(),
	visibility: visibilitySchema,
});

export const providerDataSchema = z.object({
	uuid: z.string().uuid(),
	visibility: visibilitySchema,
	music: musicListResponseSchema,
	album: albumListResponseSchema,
	artist: artistListResponseSchema,
});
export type ProviderDataDto = z.infer<typeof providerDataSchema>;
export type ProviderDataMusicDto = ProviderDataDto["music"]["musics"][number];
