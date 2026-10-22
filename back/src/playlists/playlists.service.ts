import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../core/prisma/prisma.service";

// model Playlist {
//     id        Int      @id @default(autoincrement())
//     uuid      String   @unique @default(uuid())
//     name      String
//     ownerUUID String
//     private   Boolean  @default(false)
//     createdAt DateTime @default(now())
//     updatedAt DateTime @updatedAt

//     userPlaylists UserPlaylist[]
//     musics        PlaylistMusic[]
//     owner         User            @relation(fields: [ownerUUID], references: [uuid])
// }

@Injectable()
export class PlaylistsService {
	constructor(private readonly prisma: PrismaService) { }

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

	public async createPlaylist(name: string, ownerUUID: string, isPrivate = false) {
		return this.prisma.playlist.create({
			data: {
				name,
				ownerUUID,
				private: isPrivate,
			},
		});
	}

	public async addMusicToPlaylist(uuid: string, musicUUID: string) {
		await this.getPlaylistByUUID(uuid);
		const music = await this.prisma.music.findUnique({
			where: { uuid: musicUUID },
		});
		if (!music) {
			throw new NotFoundException("Music not found");
		}
		const existingLink = await this.prisma.playlistMusic.findFirst({
			where: { playlistUUID: uuid, musicUUID },
		});
		if (existingLink) {
			return existingLink;
		}
		return this.prisma.playlistMusic.create({
			data: { playlistUUID: uuid, musicUUID },
		});
	}

	public async removeMusicFromPlaylist(uuid: string, musicUUID: string) {
		await this.getPlaylistByUUID(uuid);
		const result = await this.prisma.playlistMusic.deleteMany({
			where: { playlistUUID: uuid, musicUUID },
		});
		if (result.count === 0) {
			throw new NotFoundException("Music not found");
		}
	}

	public async deletePlaylist(uuid: string) {
		const result = await this.prisma.playlist.deleteMany({
			where: { uuid: uuid }
		});
		if (result.count === 0) throw new NotFoundException();
	}

	// public async setPlaylistCover(uuid: string, coverUUID: string) {

	// }
}
