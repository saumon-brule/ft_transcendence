import { buildMediaUrl, Provider, ProviderDataAlbumDto, providerSchema } from "@flex/shared";
import { albumItemSchema } from "@flex/shared";
import { Artist } from "./Artist";
import z from "zod";

export class Album {
	private constructor(
		public readonly uuid: string,
		public readonly name: string,
		public readonly hasCover: boolean,
		public readonly artists: Artist[],
		public readonly publishedAt: Date | null,
		public provider: Provider,
	) {}

	public coverUrl(token: string) {
		return buildMediaUrl(this.provider.address, "albumCover", this.uuid, token);
	}

	public static fromRawObject(this: void, rawAlbumObject: ProviderDataAlbumDto, provider: Provider): Album {
		const album = {
			...rawAlbumObject,
			artists: rawAlbumObject.artists.map((rawArtist) => Artist.fromRawObject(rawArtist, provider)),
		} as Album;
		Object.setPrototypeOf(album, Album.prototype);
		album.provider = provider;
		return album;
	}

	public static zodSchema = albumItemSchema.extend({
		provider: providerSchema,
		artists: z.array(Artist.zodSchema),
	}).transform(({ provider, ...album }): Album => Album.fromRawObject(album, provider));
}
