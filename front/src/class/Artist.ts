import { buildMediaUrl, ProviderDataArtistDto } from "@flex/shared";
import { artistItemSchema } from "@flex/shared";
import z from "zod";

export class Artist {
	private constructor(
		public readonly uuid: string,
		public readonly name: string,
		public readonly hasAvatar: boolean,
		public providerUuid: string,
		public providerUrl: string,
	) {}

	public avatarUrl(token: string) {
		return buildMediaUrl(this.providerUrl, "artistAvatar", this.uuid, token);
	}

	public static fromRawObject(this: void, rawArtistObject: ProviderDataArtistDto, providerUrl: string, providerUuid: string): Artist {
		const artist = { ...rawArtistObject } as Artist;
		Object.setPrototypeOf(artist, Artist.prototype);
		artist.providerUrl = providerUrl;
		artist.providerUuid = providerUuid;
		return artist;
	}

	public static zodSchema = artistItemSchema.extend({
		providerUrl: z.string(),
		providerUuid: z.string(),
	}).transform(({ providerUrl, providerUuid, ...artist }): Artist => Artist.fromRawObject(artist, providerUrl, providerUuid));
}
