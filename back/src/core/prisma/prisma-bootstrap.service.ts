import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { PERMISSIONS } from "@flex/shared";
import * as bcrypt from "bcrypt";
import { env } from "../env";

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
				login: "lilefebv",
				password: hashedPassword,
				emailValidated: true,
			},
		});

		const chantalUser = await this.prisma.user.upsert({
			where: { email: "chantal@test.com" },
			update: {},
			create: {
				email: "chantal@test.com",
				displayName: "Chantal",
				password: hashedPassword,
				emailValidated: true,
			},
		});

		const machinUser = await this.prisma.user.upsert({
			where: { email: "machin@test.com" },
			update: {},
			create: {
				email: "machin@test.com",
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

		console.log("Seed finished!");
	}
}
