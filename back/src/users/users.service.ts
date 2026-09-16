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
		return this.prisma.user.findUnique({ where: { email: email } });
	}

	public async getByLogin(login: string): Promise<User | null> {
		return this.prisma.user.findUnique({ where: { login: login } });
	}

	public async getById(id: number): Promise<User> {
		const user = await this.prisma.user.findUnique({ where: { id: id } });
		if (!user) {
			throw new NotFoundException("Cannot load the user profile");
		}
		return user;
	}

	public async createFromIntra(
		email: string,
		login: string,
	): Promise<User | null> {
		const newUser = await this.prisma.user.create({
			data: { email, login, emailValidated: true },
		});

		await this.setDefaultUserRoles(newUser.id);

		return newUser;
	}

	public async createFromRegister(
		email: string,
		password: string,
		displayName: string | null = null,
	): Promise<User | null> {
		const newUser = await this.prisma.user.create({
			data: { email, password: await bcrypt.hash(password, 10), displayName },
		});

		await this.setDefaultUserRoles(newUser.id);

		return newUser;
	}

	private async setDefaultUserRoles(userId: number) {
		const defaultRoles = await this.roles.getDefaultRoles();
		await this.prisma.userRole.createMany({
			data: defaultRoles.map((role) => ({
				roleId: role.id,
				userId,
			})),
		});
	}

	public async getUserRoles(userId: number) {
		const userRoles = await this.prisma.userRole.findMany({
			where: { userId },
			include: {
				roleRef: true,
			},
		});
		return userRoles.map((role) => role.roleRef);
	}

	public async getUserRolesDetailed(userId: number) {
		const userRoles = await this.prisma.userRole.findMany({
			where: { userId },
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

	public async addRoleToUser(userId: number, roleId: number) {
		await this.prisma.userRole.create({
			data: {
				userId: userId,
				roleId: roleId,
			},
		});
	}

	public async removeRoleFromUser(userId: number, roleId: number) {
		await this.prisma.userRole.deleteMany({
			where: {
				userId: userId,
				roleId: roleId,
			},
		});
	}

	public async doUserBypassPermission(userId: number) {
		const userSuperRole = await this.prisma.userRole.findFirst({
			where: {
				userId: userId,
				roleRef: { superRole: true },
			},
		});
		return userSuperRole !== null;
	}

	public async doUserHavePermission(
		userId: number,
		permission: Permission,
	) {
		if (await this.doUserBypassPermission(userId)) return true;

		const userPerm = await this.prisma.userRole.findFirst({
			where: {
				userId: userId,
				roleRef: {
					rolePermissions: {
						some: { permission },
					},
				},
			},
		});
		return userPerm !== null;
	}

	public async verifyEmail(userId: number) {
		await this.prisma.user.update({
			where: { id: userId },
			data: { emailValidated: true },
		});
	}

	public async setPassword(userId: number, password: string) {
		await this.prisma.user.update({
			where: { id: userId },
			data: { password: await bcrypt.hash(password, 10) },
		});
	}

	public async setEmail(userId: number, email: string) {
		await this.prisma.user.update({
			where: { id: userId },
			data: { email },
		});
	}

	public async setLogin(userId: number, login: string) {
		await this.prisma.user.update({
			where: { id: userId },
			data: { login },
		});
	}
}
