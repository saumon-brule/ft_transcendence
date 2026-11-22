/*
 * Test accounts of the development database (development only, not part of the production image).
 * Run by "pnpm run dev:init". Safe to run again.
 *
 *   liam@test.com, chantal@test.com, machin@test.com   password: abcdefgh
 *   chantal <-> liam are friends, machin asked liam (pending)
 *   liam owns a public and a private playlist
 */
import "dotenv/config";
import * as bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const PASSWORD = "abcdefgh";

async function main() {
	const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env["DATABASE_URL"] }) });

	try {
		const password = await bcrypt.hash(PASSWORD, 10);
		const account = (email: string, username: string) => prisma.user.upsert({
			where: { email },
			update: {},
			create: { email, username, password, emailValidated: true },
		});

		const liam = await account("liam@test.com", "Liammmmmmmm");
		const chantal = await account("chantal@test.com", "Chantal");
		const machin = await account("machin@test.com", "Machin");

		const friendRequest = (userUUID: string, status: "ACCEPTED" | "PENDING") => prisma.friendRequest.upsert({
			where: { userUUID_friendUUID: { userUUID, friendUUID: liam.uuid } },
			update: { status },
			create: { userUUID, friendUUID: liam.uuid, status },
		});
		await friendRequest(chantal.uuid, "ACCEPTED");
		await friendRequest(machin.uuid, "PENDING");

		for (const [name, isPrivate] of [["Liam's Private Playlist", true], ["Liam's Public Playlist", false]] as const) {
			const existing = await prisma.playlist.findFirst({ where: { ownerUUID: liam.uuid, name } });
			const playlist = existing
				? await prisma.playlist.update({ where: { id: existing.id }, data: { private: isPrivate } })
				: await prisma.playlist.create({ data: { name, ownerUUID: liam.uuid, private: isPrivate } });

			await prisma.userPlaylist.upsert({
				where: { userUUID_playlistUUID: { userUUID: liam.uuid, playlistUUID: playlist.uuid } },
				update: {},
				create: { userUUID: liam.uuid, playlistUUID: playlist.uuid },
			});
		}

		console.log("Test accounts ready: liam@test.com, chantal@test.com, machin@test.com (password: abcdefgh)");
	} finally {
		await prisma.$disconnect();
	}
}

main().catch((error: unknown) => {
	console.error(error);
	process.exit(1);
});
