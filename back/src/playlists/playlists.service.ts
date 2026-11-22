import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../core/prisma/prisma.service";
import { AppForbiddenException } from "../core/error/forbidden";
import { Music } from "../generated/prisma/client";

const SEARCH_LIMIT = 25;

const SUMMARY_SELECT = {
	uuid: true,
	name: true,
	private: true,
	createdAt: true,
	owner: { select: { uuid: true, username: true } },
	_count: { select: { musics: true } },
} as const;

const toSummary = <T extends { _count: { musics: number } }>({ _count, ...playlist }: T) => ({
	...playlist,
	musicCount: _count.musics,
});

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

	public async listPlaylists(viewerUUID: string) {
		const select = SUMMARY_SELECT;

		const [owned, followed] = await Promise.all([
			this.prisma.playlist.findMany({
				where: { ownerUUID: viewerUUID },
				select,
				orderBy: [{ createdAt: "asc" }, { id: "asc" }],
			}),
			this.prisma.userPlaylist.findMany({
				where: { userUUID: viewerUUID, playlist: { ownerUUID: { not: viewerUUID }, private: false } },
				select: { playlist: { select } },
				orderBy: [{ createdAt: "asc" }, { id: "asc" }],
			}),
		]);

		return {
			owned: owned.map(toSummary),
			followed: followed.map((link) => toSummary(link.playlist)),
		};
	}

	public async searchPlaylists(viewerUUID: string, name?: string) {
		const playlists = await this.prisma.playlist.findMany({
			where: {
				name: { contains: name, mode: "insensitive" },
				OR: [{ private: false }, { ownerUUID: viewerUUID }],
			},
			select: SUMMARY_SELECT,
			orderBy: [{ name: "asc" }, { id: "asc" }],
			take: SEARCH_LIMIT,
		});
		return playlists.map(toSummary);
	}

	public async getPlaylist(uuid: string, viewerUUID: string) {
		const playlist = await this.prisma.playlist.findUnique({
			where: { uuid },
			include: {
				owner: { select: { uuid: true, username: true } },
				musics: {
					orderBy: { id: "asc" },
					include: { provider: { select: { uuid: true, name: true, address: true } } },
				},
				userPlaylists: { where: { userUUID: viewerUUID }, select: { id: true } },
			},
		});
		const isOwner = playlist?.ownerUUID === viewerUUID;
		if (!playlist || (playlist.private && !isOwner)) {
			throw new NotFoundException("Playlist not found");
		}

		const providers = new Map(playlist.musics.map((entry) => [entry.provider.uuid, entry.provider]));
		return {
			uuid: playlist.uuid,
			name: playlist.name,
			private: playlist.private,
			createdAt: playlist.createdAt,
			owner: playlist.owner,
			isOwner,
			isFollowing: playlist.userPlaylists.length > 0,
			musics: playlist.musics.map((entry) => ({
				musicUuid: entry.musicUUID,
				providerUuid: entry.providerUUID,
				addedAt: entry.createdAt,
			})),
			providers: [...providers.values()],
		};
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

	public async assertPlaylistOwner(uuid: string, ownerUUID: string) {
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
		const provider = await this.prisma.provider.findUnique({
			where: { uuid: providerUUID },
			select: { uuid: true },
		});
		if (!provider) {
			throw new NotFoundException("Provider not found");
		}

		const existingLink = await this.prisma.playlistMusic.findFirst({
			where: {
				playlistUUID: uuid,
				musicUUID: musicUUID,
				providerUUID: providerUUID,
			},
		});
		if (existingLink) {
			throw new ConflictException({ message: "Music already in playlist", code: "CONFLICT" });
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

	public async overwritePlaylist(
		uuid:string,
		musics: { musicUUID: string; providerUUID: string }[],
		ownerUUID: string) {
		await this.assertPlaylistOwner(uuid, ownerUUID);
		
		const unique = [
			...new Map(musics.map((m) => [`${m.providerUUID}:${m.musicUUID}`, m])).values(),
		];
		
		const providerUUIDs = [...new Set(unique.map((m) => m.providerUUID))];
		if (providerUUIDs.length > 0) {
			const found = await this.prisma.provider.findMany({
				where: { uuid: { in: providerUUIDs } },
				select: { uuid: true },
			});
			if (found.length !== providerUUIDs.length) {
				throw new NotFoundException("Provider not found");
			}
		}

		await this.prisma.$transaction([
			this.prisma.playlistMusic.deleteMany({
				where: { playlistUUID: uuid }
			}),
			this.prisma.playlistMusic.createMany({
				data: unique.map((m) => ({
					playlistUUID: uuid,
					musicUUID: m.musicUUID,
					providerUUID: m.providerUUID,
				})),
			}),
		]);
	}

	public async deletePlaylist(uuid: string, ownerUUID: string) {
		await this.assertPlaylistOwner(uuid, ownerUUID);
		const result = await this.prisma.playlist.deleteMany({
			where: { uuid: uuid },
		});
		if (result.count === 0) throw new NotFoundException("Playlist Not Found");
	}

	public async followPlaylist(userUUID: string, playlistUUID: string) {
		const playlist = await this.prisma.playlist.findUnique({
			where: { uuid: playlistUUID },
		});
		if (!playlist) {
			throw new NotFoundException("Playlist not found");
		}
		if (playlist.private && playlist.ownerUUID !== userUUID) {
			throw new AppForbiddenException(
				"FORBIDDEN",
				"You are not allowed to follow this playlist",
			);
		}
		await this.prisma.userPlaylist.create({
			data: { userUUID, playlistUUID },
		});
	}

	public async unfollowPlaylist(userUUID: string, playlistUUID: string) {
		const result = await this.prisma.userPlaylist.deleteMany({
			where: { userUUID, playlistUUID },
		});
		if (result.count === 0) {
			throw new NotFoundException("Playlist not found");
		}
	}
}
