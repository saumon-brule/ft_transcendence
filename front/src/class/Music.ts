import { buildMediaUrl, musicItemSchema, type ProviderDataMusicDto, type ProviderDataArtistDto, Provider, providerSchema } from "@flex/shared";
import z from "zod";
import { getMediaToken } from "~/api/providerClients";

type MusicAlbumDto = NonNullable<ProviderDataMusicDto["album"]>;

export const musicStateSchema = z.enum(["available", "restricted", "offline", "missing", "loading"]);
export type MusicState = z.infer<typeof musicStateSchema>;
export type AvailableMusicState = Extract<MusicState, "available">;
export type UnavailableMusicState = Exclude<MusicState, "available">;

export type MusicWithAlbum = Music & { album: MusicAlbumDto };
export type UnavailableMusic = Music & { state: UnavailableMusicState };
export type LoadingMusic = Music & { state: Extract<MusicState, "loading"> };

export class Music {
	protected constructor(
		public readonly name: string,
		public readonly duration: number,
		public readonly publishedAt: Date | null,
		public readonly hasCover: boolean,
		public readonly artists: ProviderDataArtistDto[],
		public readonly album: MusicAlbumDto | null,
		public readonly uuid: string,
		public provider: Provider,
		public state: MusicState,
	) {}

	public async audioUrl(): Promise<string> {
		const token = await getMediaToken(this.provider.address, this.provider.uuid);
		if (!token) {
			throw new Error("Failed to get media token for provider");
		}
		return buildMediaUrl(this.provider.address, "audio", this.uuid, token);
	}

	public coverUrl(token: string) {
		return buildMediaUrl(this.provider.address, "musicCover", this.uuid, token);
	}

	public hasAlbum(): this is MusicWithAlbum {
		return this.album !== null;
	}

	public isUnavailable(): this is UnavailableMusic {
		return this.state !== "available";
	}

	public isLoading(): this is LoadingMusic {
		return this.state === "loading";
	}

	public albumRoute(this: MusicWithAlbum) {
		return `/provider/${this.provider.uuid}/album/${this.album.uuid}`;
	}

	public static createUnavailable(this: void, uuid: string, provider: Provider, state: UnavailableMusicState): Music {
		return new Music("", 0, null, false, [], null, uuid, provider, state);
	}

	public static fromRawObject(this: void, rawMusicObject: ProviderDataMusicDto, provider: Provider): Music {
		const music = { ...rawMusicObject } as Music;
		Object.setPrototypeOf(music, Music.prototype);
		music.provider = provider;
		music.state = "available";
		return music;
	}

	public static zodSchema = musicItemSchema.extend({
		provider: providerSchema,
		state: musicStateSchema,
	}).transform(({ provider, ...music }): Music => Music.fromRawObject(music, provider));
}
