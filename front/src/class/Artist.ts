import { buildMediaUrl, Provider, ProviderDataArtistDto, providerSchema } from "@flex/shared";
import { artistItemSchema } from "@flex/shared";

export class Artist {
	private constructor(
		public readonly uuid: string,
		public readonly name: string,
		public readonly hasAvatar: boolean,
		public provider: Provider,
	) {}

	public avatarUrl(token: string) {
		return buildMediaUrl(this.provider.address, "artistAvatar", this.uuid, token);
	}

	public route() {
		return `/provider/${this.provider.uuid}/artist/${this.uuid}`;
	}

	public static fromRawObject(this: void, rawArtistObject: ProviderDataArtistDto, provider: Provider): Artist {
		const artist = { ...rawArtistObject } as Artist;
		Object.setPrototypeOf(artist, Artist.prototype);
		artist.provider = provider;
		return artist;
	}

	public static zodSchema = artistItemSchema.extend({
		provider: providerSchema,
	}).transform(({ provider, ...artist }): Artist => Artist.fromRawObject(artist, provider));
}
