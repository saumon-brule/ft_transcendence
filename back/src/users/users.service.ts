import { Injectable, NotFoundException } from "@nestjs/common";
import { User } from "../generated/prisma/client";
import { PrismaService } from "../core/prisma/prisma.service";
import { Permission } from "@flex/shared";
import { RolesService } from "../roles/roles.service";
import * as bcrypt from "bcrypt";
import { Cron } from "@nestjs/schedule";
import { WinstonLoggerService } from "../core/logging/logger.service";
import { LogBuilder } from "../core/logging/log-builder";

@Injectable()
export class UsersService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly roles: RolesService,
		private readonly logger: WinstonLoggerService,
	) {}

	@Cron("0 * * * *")
	async clearUnverifiedUsers() {
		const result = await this.prisma.user.deleteMany({
			where: {
				emailValidated: false,
				createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
			},
		});
		this.logger.log(LogBuilder.user.unverifiedCleaned(result.count));
	}

	public async getAll(): Promise<User[]> {
		return this.prisma.user.findMany();
	}

	public async getByEmail(email: string): Promise<User | null> {
		return this.prisma.user.findUnique({ where: { email: this.normalizeEmail(email) } });
	}

	public async getByIntraId(intraId: number): Promise<User | null> {
		return this.prisma.user.findUnique({ where: { intraId } });
	}

	public async getByUUID(uuid: string): Promise<User> {
		const user = await this.prisma.user.findUnique({ where: { uuid: uuid } });
		if (!user) {
			throw new NotFoundException("Cannot load the user profile");
		}
		return user;
	}

	public async getExposedInfoByUUID(uuid: string) {
		const user = await this.prisma.user.findUnique({
			where: { uuid: uuid },
			include: {
				_count: { select: { ownedProviders: true, ownedPlaylists: true } },
				ownedProviders: { where: { publicDisplay: true } },
				providers: {
					where: {
						publicDisplay: true,
						provider: { is: { publicDisplay: true } },
					},
					include: { provider: true },
				},
				currentlyListening: true,
				ownedPlaylists: {
					where: { private: false },
					include: {
						_count: {
							select: { musics: true },
						},
					},
				},
				friendsRequests: {
					where: { status: "ACCEPTED" },
					select: {
						friend: { select: { uuid: true, username: true } },
					},
				},
				friendsReceive: {
					where: { status: { in: ["ACCEPTED", "PENDING"] } },
					select: {
						status: true,
						user: { select: { uuid: true, username: true } },
					},
				},
			},
		});
		if (!user) {
			throw new NotFoundException("Cannot load the user profile");
		}
		if (user.listeningPrivate) {
			user.currentlyListeningUUID = null;
			user.listeningUntil = null;
		}
		const friends = [
			...user.friendsRequests.map((request) => request.friend),
			...user.friendsReceive
				.filter((request) => request.status === "ACCEPTED")
				.map((request) => request.user),
		];
		const friendRequests = user.friendsReceive
			.filter((request) => request.status === "PENDING")
			.map((request) => request.user);

		return { ...user, hasPassword: !!user.password, connectedProviders: user.providers.map((p) => p.provider), friends, friendRequests };
	}

	public async createFromIntra(
		email: string,
		login: string,
		intraId: number,
	): Promise<User | null> {
		const newUser = await this.prisma.user.create({
			data: { email: this.normalizeEmail(email), username: login, emailValidated: true, intraId },
		});

		await this.setDefaultUserRoles(newUser.uuid);

		return newUser;
	}

	public async createFromRegister(
		email: string,
		password: string,
		username: string,
	): Promise<User | null> {
		const newUser = await this.prisma.user.create({
			data: { email: this.normalizeEmail(email), password: await bcrypt.hash(password, 10), username },
		});

		await this.setDefaultUserRoles(newUser.uuid);

		return newUser;
	}

	private async setDefaultUserRoles(userUUID: string) {
		const defaultRoles = await this.roles.getDefaultRoles();
		await this.prisma.userRole.createMany({
			data: defaultRoles.map((role) => ({
				roleId: role.id,
				userUUID,
			})),
		});
	}

	public async getUserRoles(userUUID: string) {
		const userRoles = await this.prisma.userRole.findMany({
			where: { userUUID },
			include: {
				roleRef: true,
			},
		});
		return userRoles.map((role) => role.roleRef);
	}

	public async getUserRolesDetailed(userUUID: string) {
		const userRoles = await this.prisma.userRole.findMany({
			where: { userUUID },
			include: {
				roleRef: {
					include: {
						rolePermissions: {
							select: { permission: true },
						},
					},
				},
			},
		});

		return userRoles.map(({ roleRef }) => {
			const { rolePermissions, ...rest } = roleRef;
			return {
				...rest,
				permissions: rolePermissions.map((rp) => rp.permission),
			};
		});
	}

	public async addRoleToUser(userUUID: string, roleId: number) {
		await this.prisma.userRole.create({
			data: {
				userUUID: userUUID,
				roleId: roleId,
			},
		});
	}

	public async removeRoleFromUser(userUUID: string, roleId: number) {
		await this.prisma.userRole.deleteMany({
			where: {
				userUUID: userUUID,
				roleId: roleId,
			},
		});
	}

	public async doUserBypassPermission(userUUID: string) {
		const userSuperRole = await this.prisma.userRole.findFirst({
			where: {
				userUUID: userUUID,
				roleRef: { superRole: true },
			},
		});
		return userSuperRole !== null;
	}

	public async doUserHavePermission(
		userUUID: string,
		permission: Permission,
	) {
		if (await this.doUserBypassPermission(userUUID)) return true;

		const userPerm = await this.prisma.userRole.findFirst({
			where: {
				userUUID: userUUID,
				roleRef: {
					rolePermissions: {
						some: { permission },
					},
				},
			},
		});
		return userPerm !== null;
	}

	public async verifyEmail(userUUID: string) {
		await this.prisma.user.update({
			where: { uuid: userUUID },
			data: { emailValidated: true },
		});
	}

	public async setPassword(userUUID: string, password: string) {
		await this.prisma.user.update({
			where: { uuid: userUUID },
			data: { password: await bcrypt.hash(password, 10) },
		});
	}

	public async setEmail(userUUID: string, email: string) {
		await this.prisma.user.update({
			where: { uuid: userUUID },
			data: { email: this.normalizeEmail(email) },
		});
	}

	public async updateMe(uuid: string, data: { username?: string; listeningPrivate?: boolean; language?: string }) {
		await this.prisma.user.update({
			where: { uuid },
			data,
		});

		return this.getExposedInfoByUUID(uuid);
	}

	public async updateAvatarTimestamp(uuid: string) {
		await this.prisma.user.update({
			where: { uuid },
			data: { avatarUpdatedAt: new Date() },
		});
	}

	public async linkIntraAccount(uuid: string, intraId: number) {
		await this.prisma.user.update({
			where: { uuid },
			data: { intraId },
		});
	}

	public async unlinkIntraAccount(uuid: string) {
		await this.prisma.user.update({
			where: { uuid },
			data: { intraId: null },
		});
	}

	private normalizeEmail(email: string) {
		return email.trim().toLowerCase();
	}

}
