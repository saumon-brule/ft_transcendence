import { PlaylistDetailDto, PlaylistSummaryDto, playlistSummarySchema } from "@flex/shared";

export class Playlist {
	public readonly private!: boolean;

	private constructor(
		public readonly uuid: string,
		public readonly name: string,
		public readonly createdAt: Date,
		public readonly owner: { uuid: string; username: string },
		public readonly musicCount: number,
	) {}

	public route() {
		return `/playlist/${this.uuid}`;
	}

	public static fromRawObject(this: void, rawPlaylistObject: PlaylistSummaryDto): Playlist {
		const playlist = { ...rawPlaylistObject } as Playlist;
		Object.setPrototypeOf(playlist, Playlist.prototype);
		return playlist;
	}

	public static fromDetail(this: void, { musics, ...detail }: PlaylistDetailDto): Playlist {
		return Playlist.fromRawObject({
			uuid: detail.uuid,
			name: detail.name,
			private: detail.private,
			createdAt: detail.createdAt,
			owner: detail.owner,
			musicCount: musics.length,
		});
	}

	public static zodSchema = playlistSummarySchema.transform((playlist): Playlist => Playlist.fromRawObject(playlist));
}
