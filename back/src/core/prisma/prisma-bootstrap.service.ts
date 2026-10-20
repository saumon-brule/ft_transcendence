import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { PERMISSIONS } from "@flex/shared";
import * as bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import { env } from "../env";
import { generateApiKey } from "../../providersAPI/providerAPIKey";

function providerCredentials() {
	const uuid = randomUUID();
	return { uuid, hashedKey: generateApiKey(uuid).keyHash };
}

const MANAGER_PERMISSIONS = [
	PERMISSIONS.MEMBERS.MY_PROFILE,
	PERMISSIONS.MEMBERS.ANY_PROFILE,
	PERMISSIONS.MEMBERS.ALL_PROFILES,
	PERMISSIONS.MEMBERS.GET_ROLES,
	PERMISSIONS.MEMBERS.GET_ROLES_DETAILED,
	PERMISSIONS.ROLES.LIST,
	PERMISSIONS.ROLES.DETAILS,
	PERMISSIONS.ROLES.LIST_MEMBERS,
];

const USER_PERMISSIONS = [
	PERMISSIONS.MEMBERS.MY_PROFILE,
	PERMISSIONS.ROLES.LIST,
];

@Injectable()
export class DatabaseBootstrapService implements OnModuleInit {
	constructor(private readonly prisma: PrismaService) {}

	public async onModuleInit(): Promise<void> {
		console.log("Seeding...");

		// ─── App config ─────────────────────────────────────────────────────────────

		await this.prisma.appConfig.upsert({
			where: { key: "42api-uid" },
			update: { value: env.API42_CLIENT_UID ?? "" },
			create: { key: "42api-uid", value: env.API42_CLIENT_UID ?? "" },
		});

		await this.prisma.appConfig.upsert({
			where: { key: "42api-secret" },
			update: { value: env.API42_CLIENT_SECRET ?? "" },
			create: { key: "42api-secret", value: env.API42_CLIENT_SECRET ?? "" },
		});

		// ─── Roles ───────────────────────────────────────────────────────────────────

		const bigboss = await this.prisma.role.upsert({
			where: { name: "bigboss" },
			update: {},
			create: { name: "bigboss", superRole: true },
		});

		const manager = await this.prisma.role.upsert({
			where: { name: "manager" },
			update: {},
			create: { name: "manager", superRole: false },
		});

		const user = await this.prisma.role.upsert({
			where: { name: "user" },
			update: {},
			create: { name: "user", superRole: false, defaultRole: true },
		});

		// ─── Permissions ─────────────────────────────────────────────────────────────

		await this.prisma.rolePermission.deleteMany({
			where: { roleId: manager.id },
		});
		await this.prisma.rolePermission.deleteMany({ where: { roleId: user.id } });

		await this.prisma.rolePermission.createMany({
			data: MANAGER_PERMISSIONS.map((permission) => ({
				roleId: manager.id,
				permission,
			})),
			skipDuplicates: true,
		});

		await this.prisma.rolePermission.createMany({
			data: USER_PERMISSIONS.map((permission) => ({
				roleId: user.id,
				permission,
			})),
			skipDuplicates: true,
		});

		console.log("Roles created : bigboss (superRole), manager, user");
		console.log("  bigboss     : every permissions (superRole)");
		console.log(`  manager     : ${MANAGER_PERMISSIONS.length} permissions`);
		console.log(`  user        : ${USER_PERMISSIONS.length} permissions`);

		// ─── Users ───────────────────────────────────────────────────────────────────

		const hashedPassword = await bcrypt.hash("abcdefgh", 10);

		const liamUser = await this.prisma.user.upsert({
			where: { email: "liam@test.com" },
			update: {},
			create: {
				email: "liam@test.com",
				username: "Liammmmmmmm",
				password: hashedPassword,
				emailValidated: true,
			},
		});

		const chantalUser = await this.prisma.user.upsert({
			where: { email: "chantal@test.com" },
			update: {},
			create: {
				email: "chantal@test.com",
				username: "Chantal",
				password: hashedPassword,
				emailValidated: true,
			},
		});

		const machinUser = await this.prisma.user.upsert({
			where: { email: "machin@test.com" },
			update: {},
			create: {
				email: "machin@test.com",
				username: "Machin",
				password: hashedPassword,
				emailValidated: true,
			},
		});

		console.log(
			"Users created : liam@test.com, chantal@test.com, machin@test.com",
		);

		// ─── User roles ─────────────────────────────────────────────────────────────

		await this.prisma.userRole.upsert({
			where: {
				userId_roleId: { userId: liamUser.id, roleId: bigboss.id },
			},
			update: {},
			create: { userId: liamUser.id, roleId: bigboss.id },
		});

		await this.prisma.userRole.upsert({
			where: {
				userId_roleId: { userId: chantalUser.id, roleId: manager.id },
			},
			update: {},
			create: { userId: chantalUser.id, roleId: manager.id },
		});

		await this.prisma.userRole.upsert({
			where: {
				userId_roleId: { userId: machinUser.id, roleId: user.id },
			},
			update: {},
			create: { userId: machinUser.id, roleId: user.id },
		});

		console.log("Roles asignated : liam→bigboss, chantal→manager, machin→user");

		const privateProvider = await this.prisma.provider.upsert({
			where: { name: "Liam's Private Provider" },
			update: {
				ownerId: liamUser.id,
				adress: "liam-private-provider",
				publicDisplay: false,
			},
			create: {
				name: "Liam's Private Provider",
				adress: "liam-private-provider",
				ownerId: liamUser.id,
				publicDisplay: false,
				...providerCredentials(),
			},
		});

		const publicProvider = await this.prisma.provider.upsert({
			where: { name: "Liam's Public Provider" },
			update: {
				ownerId: liamUser.id,
				adress: "liam-public-provider",
				publicDisplay: true,
			},
			create: {
				name: "Liam's Public Provider",
				adress: "liam-public-provider",
				ownerId: liamUser.id,
				publicDisplay: true,
				...providerCredentials(),
			},
		});

		const additionalProviders = [
			{ name: "Liam's Provider 3", adress: "liam-provider-3" },
			{ name: "Liam's Provider 4", adress: "liam-provider-4" },
			{ name: "Liam's Provider 5", adress: "liam-provider-5" },
			{ name: "Liam's Provider 6", adress: "liam-provider-6" },
			{ name: "Liam's Provider 7", adress: "liam-provider-7" },
			{ name: "Liam's Provider 8", adress: "liam-provider-8" },
		];

		for (const provider of additionalProviders) {
			await this.prisma.provider.upsert({
				where: { name: provider.name },
				update: { ownerId: liamUser.id, adress: provider.adress },
				create: { ...provider, ownerId: liamUser.id, ...providerCredentials() },
			});
		}

		await this.prisma.providerUser.upsert({
			where: {
				providerId_userId: {
					providerId: privateProvider.id,
					userId: liamUser.id,
				},
			},
			update: { publicDisplay: false },
			create: {
				providerId: privateProvider.id,
				userId: liamUser.id,
				publicDisplay: false,
			},
		});

		await this.prisma.providerUser.upsert({
			where: {
				providerId_userId: {
					providerId: publicProvider.id,
					userId: liamUser.id,
				},
			},
			update: { publicDisplay: true },
			create: {
				providerId: publicProvider.id,
				userId: liamUser.id,
				publicDisplay: true,
			},
		});

		const musicData = [
			{ title: "the newer sweet groove", artist: "Chris Gouge", duration: 214 },
			{ title: "Afterglow", artist: "Paper Satellites", duration: 189 },
			{ title: "Static Hearts", artist: "The Frequency", duration: 242 },
			{ title: "Blue Hour", artist: "Lumen Coast", duration: 201 },
			{ title: "Last Signal", artist: "Northbound", duration: 227 },
		];
		const musics: { id: number }[] = [];
		for (const data of musicData) {
			const existingMusic = await this.prisma.music.findFirst({
				where: { title: data.title, artist: data.artist },
			});
			musics.push(
				existingMusic ?? (await this.prisma.music.create({ data })),
			);
		}

		const privatePlaylist = await this.prisma.playlist.findFirst({
			where: { ownerId: liamUser.id, name: "Liam's Private Playlist" },
		});
		let liamPrivatePlaylist = privatePlaylist;
		if (!liamPrivatePlaylist) {
			liamPrivatePlaylist = await this.prisma.playlist.create({
				data: {
					name: "Liam's Private Playlist",
					ownerId: liamUser.id,
					private: true,
				},
			});
		}
		await this.prisma.playlist.update({
			where: { id: liamPrivatePlaylist.id },
			data: { private: true },
		});

		const publicPlaylist = await this.prisma.playlist.findFirst({
			where: { ownerId: liamUser.id, name: "Liam's Public Playlist" },
		});
		let liamPublicPlaylist = publicPlaylist;
		if (!liamPublicPlaylist) {
			liamPublicPlaylist = await this.prisma.playlist.create({
				data: {
					name: "Liam's Public Playlist",
					ownerId: liamUser.id,
					private: false,
				},
			});
		}
		await this.prisma.playlist.update({
			where: { id: liamPublicPlaylist.id },
			data: { private: false },
		});

		await this.prisma.userPlaylist.upsert({
			where: {
				userId_playlistId: {
					userId: liamUser.id,
					playlistId: liamPrivatePlaylist.id,
				},
			},
			update: {},
			create: {
				userId: liamUser.id,
				playlistId: liamPrivatePlaylist.id,
			},
		});
		await this.prisma.userPlaylist.upsert({
			where: {
				userId_playlistId: {
					userId: liamUser.id,
					playlistId: liamPublicPlaylist.id,
				},
			},
			update: {},
			create: {
				userId: liamUser.id,
				playlistId: liamPublicPlaylist.id,
			},
		});

		const addMusicToPlaylist = async (playlistId: number, musicId: number) => {
			const existingLink = await this.prisma.playlistMusic.findFirst({
				where: { playlistId, musicId },
			});
			if (!existingLink) {
				await this.prisma.playlistMusic.create({ data: { playlistId, musicId } });
			}
		};
		for (const music of musics.slice(0, 2)) {
			await addMusicToPlaylist(liamPrivatePlaylist.id, music.id);
		}
		for (const music of musics.slice(2)) {
			await addMusicToPlaylist(liamPublicPlaylist.id, music.id);
		}

		await this.prisma.user.update({
			where: { id: liamUser.id },
			data: {
				currentlyListeningId: musics[0].id,
				listeningUntil: new Date(Date.now() + 5 * 60 * 1000),
				listeningPrivate: false,
			},
		});

		console.log("Seed finished!");
	}
}
