import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../core/prisma/prisma.service";
import { AppForbiddenException } from "../core/error/forbidden";

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

	public async createPlaylist(name: string, ownerUUID: string, isPrivate = false) {
		return this.prisma.playlist.create({
			data: {
				name,
				ownerUUID,
				private: isPrivate,
			},
		});
	}

	private async assertPlaylistOwner(uuid: string, ownerUUID: string) {
		const playlist = await this.getPlaylistByUUID(uuid);
		if (playlist.owner.uuid !== ownerUUID) {
			throw new AppForbiddenException(
				"FORBIDDEN",
				"You are not the owner of this playlist",
			);
		}
	}

	public async updatePlaylistName(uuid: string, newName: string, ownerUUID: string) {
		await this.assertPlaylistOwner(uuid, ownerUUID);
		return this.prisma.playlist.update({
			where: { uuid },
			data: { name: newName },
		});
	}

	public async setPlaylistPrivacy(uuid: string, isPrivate: boolean, ownerUUID: string) {
		await this.assertPlaylistOwner(uuid, ownerUUID);
		return this.prisma.playlist.update({
			where: { uuid },
			data: { private: isPrivate },
		});
	}

	public async addMusicToPlaylist(uuid: string, musicUUID: string, providerUUID: string, ownerUUID: string) {
		await this.assertPlaylistOwner(uuid, ownerUUID);
		const music = await this.prisma.music.findUnique({
			where: { uuid: musicUUID },
		});
		if (!music) {
			throw new NotFoundException("Music not found");
		}
		const existingLink = await this.prisma.playlistMusic.findFirst({
			where: {
				playlistUUID: uuid,
				musicUUID: musicUUID,
				providerUUID: providerUUID,
			},
		});
		if (existingLink) {
			return existingLink;
		}
		return this.prisma.playlistMusic.create({
			data: { playlistUUID: uuid, musicUUID, providerUUID: providerUUID },
		});
	}

	public async removeMusicFromPlaylist(uuid: string, musicUUID: string, providerUUID: string, ownerUUID: string) {
		await this.assertPlaylistOwner(uuid, ownerUUID);
		const result = await this.prisma.playlistMusic.deleteMany({
			where: {
				playlistUUID: uuid,
				musicUUID: musicUUID,
				providerUUID: providerUUID,
			},
		});
		if (result.count === 0) {
			throw new NotFoundException("Music not found");
		}
	}

	public async deletePlaylist(uuid: string) {
		const result = await this.prisma.playlist.deleteMany({
			where: { uuid: uuid },
		});
		if (result.count === 0) throw new NotFoundException("Playlist Not Found");
	}
}
