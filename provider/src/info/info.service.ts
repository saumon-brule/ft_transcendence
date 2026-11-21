import { Injectable } from "@nestjs/common";
import { DEFAULT_PAGINATION_LIMIT } from "@flex/shared";
import { PrismaService } from "../core/prisma/prisma.service";
import { resolvePermissions } from "../core/auth/permissions";
import { albumItemInclude, musicItemInclude, toAlbumItem, toArtistItem, toMusicItem } from "../core/catalog/catalog.mappers";

const DB_TIMEOUT_MS = 3000;
const byId = { id: "asc" as const };
const firstPage = { take: DEFAULT_PAGINATION_LIMIT, skip: 0 };

@Injectable()
export class InfoService {
	constructor(private readonly prisma: PrismaService) {}

	async isDatabaseUp(): Promise<boolean> {
		try {
			await Promise.race([
				this.prisma.$queryRaw`SELECT 1`,
				new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), DB_TIMEOUT_MS).unref()),
			]);
			return true;
		} catch {
			return false;
		}
	}

	async getWithMember(userUuid: string) {
		const [info, { ownerUuid }, member] = await Promise.all([
			this.get(),
			this.prisma.provider.findUniqueOrThrow({ where: { id: 1 }, select: { ownerUuid: true } }),
			this.prisma.member.findUnique({
				where: { uuid: userUuid },
				include: { roles: { include: { role: { include: { permissions: true } } }, orderBy: { role: { name: "asc" } } } },
			}),
		]);

		const isOwner = ownerUuid === userUuid;
		if (!member) {
			return { ...info, member: { status: "none" as const, isOwner, memberSince: null, revokedAt: null, roles: [], permissions: [] } };
		}

		const revoked = member.revokedAt !== null;
		const granted = new Set(member.roles.flatMap((link) => link.role.permissions.map((row) => row.permission)));
		return {
			...info,
			member: {
				status: revoked
					? "revoked" as const
					: "active" as const,
				isOwner,
				memberSince: member.createdAt,
				revokedAt: member.revokedAt,
				roles: revoked
					? []
					: member.roles.map((link) => ({ uuid: link.role.uuid, name: link.role.name })),
				permissions: revoked
					? []
					: resolvePermissions(isOwner, granted),
			},
		};
	}

	async get() {
		const provider = await this.prisma.provider.findUniqueOrThrow({ where: { id: 1 } });
		return { uuid: provider.uuid, visibility: provider.visibility };
	}

	async all() {
		const [info, [musics, musicTotal, albums, albumTotal, artists, artistTotal]] = await Promise.all([
			this.get(),
			this.prisma.$transaction([
				this.prisma.music.findMany({ include: musicItemInclude, orderBy: byId, ...firstPage }),
				this.prisma.music.count(),
				this.prisma.album.findMany({ include: albumItemInclude, orderBy: byId, ...firstPage }),
				this.prisma.album.count(),
				this.prisma.artist.findMany({ orderBy: byId, ...firstPage }),
				this.prisma.artist.count(),
			]),
		]);

		return {
			...info,
			music: { musics: musics.map(toMusicItem), total: musicTotal },
			album: { albums: albums.map(toAlbumItem), total: albumTotal },
			artist: { artists: artists.map(toArtistItem), total: artistTotal },
		};
	}
}
