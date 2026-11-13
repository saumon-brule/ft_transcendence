import { buildMediaUrl, musicItemSchema, type ProviderDataMusicDto, type ProviderDataArtistDto } from "@flex/shared";
import z from "zod";
import { getMediaToken } from "~/api/providerClients";

type MusicAlbumDto = ProviderDataMusicDto["album"];

type MusicWithAlbum = Music & { album: NonNullable<MusicAlbumDto> };

export class Music {
	private constructor(
		public readonly uuid: string,
		public readonly name: string,
		public providerUuid: string,
		public providerUrl: string,
		public readonly duration: number,
		public readonly publishedAt: Date | null,
		public readonly hasCover: boolean,
		public readonly artists: ProviderDataArtistDto[],
		public readonly album: MusicAlbumDto,
	) {}

	public async audioUrl(): Promise<string> {
		const token = await getMediaToken(this.providerUrl, this.providerUuid);
		if (!token) {
			throw new Error("Failed to get media token for provider");
		}
		return buildMediaUrl(this.providerUrl, "audio", this.uuid, token);
	}

	public coverUrl(token: string) {
		return buildMediaUrl(this.providerUrl, "musicCover", this.uuid, token);
	}

	public hasAlbum(): this is MusicWithAlbum {
		return this.album !== null;
	}

	public albumRoute(this: MusicWithAlbum) {
		return `/provider/${this.providerUuid}/album/${this.album.uuid}`;
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
