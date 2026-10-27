import { buildMediaUrl, ProviderDataDto } from "@flex/shared";
import { ProviderDataMusicDto } from "node_modules/@flex/shared/src/contracts/provider/info/schemas/info.schema";
import z from "zod";
import { getMediaToken } from "~/api/providerClients";
import { summonErrorToast } from "~/components/ui/Toaster";

export class Music {
	private constructor(
		public readonly uuid: string,
		public readonly name: string,
		public providerUrl: string,
		public readonly duration: number,
		public readonly publishedAt: Date | null,
		public readonly hasCover: boolean,
		public readonly artists: { uuid: string; name: string; hasAvatar: boolean }[],
		public readonly album: { uuid: string; name: string; publishedAt: Date | null; hasCover: boolean } | null,
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

	public static fromRawObject(this: void, rawMusicObject: ProviderDataMusicDto, providerUrl: string): Music {
		const music = { ...rawMusicObject } as Music;
		Object.setPrototypeOf(music, Music.prototype);
		music.providerUrl = providerUrl;
		return music;
	}

	public static zodSchema = z.null();
}
