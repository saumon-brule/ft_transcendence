import { buildMediaUrl, ProviderDataAlbumDto } from "@flex/shared";
import { albumItemSchema } from "@flex/shared";
import z from "zod";

export class Album {
	private constructor(
		public readonly uuid: string,
		public readonly name: string,
		public readonly hasCover: boolean,
		public readonly artists: { uuid: string; name: string; hasAvatar: boolean }[],
		public readonly publishedAt: Date | null,
		public providerUuid: string,
		public providerUrl: string,
	) {}

	public coverUrl(token: string) {
		return buildMediaUrl(this.providerUrl, "albumCover", this.uuid, token);
	}

	public static fromRawObject(this: void, rawAlbumObject: ProviderDataAlbumDto, providerUrl: string, providerUuid: string): Album {
		const album = { ...rawAlbumObject } as Album;
		Object.setPrototypeOf(album, Album.prototype);
		album.providerUrl = providerUrl;
		album.providerUuid = providerUuid;
		return album;
	}

	public static zodSchema = albumItemSchema.extend({
		providerUrl: z.string(),
		providerUuid: z.string(),
	}).transform(({ providerUrl, providerUuid, ...album }): Album => Album.fromRawObject(album, providerUrl, providerUuid));
}
