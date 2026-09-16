import z from "zod";

export class Music {
	constructor(
		public readonly providerBase: string,
		public readonly path: string,
	) {}

	public url(): URL {
		return new URL(this.path, this.providerBase || document.location.href);
	}

	static readonly zodSchema = z.object({
		providerBase: z.string(),
		path: z.string(),
	}).transform((music): Music => {
		Object.setPrototypeOf(music, Music.prototype);
		return music as Music;
	});
}
