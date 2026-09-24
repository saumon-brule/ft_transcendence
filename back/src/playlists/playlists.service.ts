import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../core/prisma/prisma.service";

@Injectable()
export class PlaylistsService {
	constructor(private readonly prisma: PrismaService) {}

	public async getPlaylistByUUID(uuid: string) {
		const playlist = await this.prisma.playlist.findUnique({
			where: { uuid },
			include: { owner: true },
		});
		if (!playlist) {
			throw new NotFoundException("Playlist not found");
		}
		return playlist;
	}

}
