import { buildMediaUrl, musicItemSchema, type ProviderDataMusicDto } from "@flex/shared";
import z from "zod";
import { getMediaToken } from "~/api/providerClients";
import { summonErrorToast } from "~/components/ui/Toaster";

export class Music {
	private constructor(
		public readonly uuid: string,
		public readonly name: string,
		public providerUuid: string,
		public providerUrl: string,
		public readonly duration: number,
		public readonly publishedAt: Date | null,
		public readonly hasCover: boolean,
		public readonly artists: { uuid: string; name: string; hasAvatar: boolean }[],
		public readonly album: ProviderDataMusicDto["album"],
	) {}

	public async audioUrl(): Promise<string> {
		const token = await getMediaToken(this.providerUrl);
		if (!token) {
			summonErrorToast("Failed to get media token for provider");
			throw new Error("Failed to get media token for provider");
		}
		return buildMediaUrl(this.providerUrl, "audio", this.uuid, token);
	}

	public coverUrl(token: string) {
		// const token = await getMediaToken(this.providerUrl);
		// if (!token) {
		// 	summonErrorToast("Failed to get media token for provider");
		// 	throw new Error("Failed to get media token for provider");
		// }
		return buildMediaUrl(this.providerUrl, "musicCover", this.uuid, token);
	}

	public static fromRawObject(this: void, rawMusicObject: ProviderDataMusicDto, providerUrl: string, providerUuid: string): Music {
		const music = { ...rawMusicObject } as Music;
		Object.setPrototypeOf(music, Music.prototype);
		music.providerUrl = providerUrl;
		music.providerUuid = providerUuid;
		return music;
	}

	public static zodSchema = musicItemSchema.extend({
		providerUrl: z.string(),
		providerUuid: z.string(),
	}).transform(({ providerUrl, providerUuid, ...music }): Music => Music.fromRawObject(music, providerUrl, providerUuid));
}
