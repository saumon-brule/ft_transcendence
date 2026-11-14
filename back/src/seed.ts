/*
 * Mock playlists to check every state of a track in the playlist page.
 *
 *   make server-seed                              -> playlists of the oldest account, on the first provider it owns
 *   make server-seed ARGS="--user=me@mail.com"    -> playlists of another account
 *   make server-seed ARGS="--provider=<uuid>"     -> provider holding the playable tracks
 *   make server-seed ARGS="--restricted-provider=<uuid>"  -> provider the account is not a member of
 *   make server-seed ARGS=--clean                 -> removes everything this script created
 *
 * The playable tracks are the three mp3 of provider/mock (make provider-seed imports them with
 * fixed uuids), so run it first on the provider. Offline tracks live on a mock provider whose
 * address never answers. Restricted tracks need a real provider the account has not joined: the
 * first one found is used, there is none to invent. Everything is named "[mock] ..." and the
 * mock listener owns the followed playlist; running the script again recreates it all.
 */
import "dotenv/config";
import { randomBytes } from "node:crypto";
import * as bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const MOCK_PREFIX = "[mock] ";
const MOCK_USER_EMAIL = "mock-listener@flex.invalid";
const OFFLINE_PROVIDER = { name: "Mock offline provider", address: "https://mock-offline.invalid" };

const PLAYABLE = [
	"00000000-0000-4000-a000-000000000001",
	"00000000-0000-4000-a000-000000000002",
	"00000000-0000-4000-a000-000000000003",
];
const missing = (n: number) => `00000000-0000-4000-b000-00000000000${n}`;
const elsewhere = (n: number) => `00000000-0000-4000-c000-00000000000${n}`;

const args = process.argv.slice(2);
const option = (name: string) => args.find((arg) => arg.startsWith(`--${name}=`))?.split("=")[1];

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env["DATABASE_URL"] }) });

async function clean() {
	const playlists = await prisma.playlist.deleteMany({ where: { name: { startsWith: MOCK_PREFIX } } });
	const users = await prisma.user.deleteMany({ where: { email: MOCK_USER_EMAIL } });
	const providers = await prisma.provider.deleteMany({ where: { name: OFFLINE_PROVIDER.name } });
	console.log(`Removed ${playlists.count} playlists, ${users.count} mock user, ${providers.count} mock provider`);
}

async function seed() {
	const email = option("user");
	const viewer = email
		? await prisma.user.findUnique({ where: { email } })
		: await prisma.user.findFirst({ where: { email: { not: MOCK_USER_EMAIL } }, orderBy: { id: "asc" } });
	if (!viewer) throw new Error(email
		? `No account with the email ${email}`
		: "No account yet: register one first, or pass --user=<email>");

	const providerArg = option("provider");
	const live = await prisma.provider.findFirst({
		where: providerArg
			? { uuid: providerArg }
			: { ownerUUID: viewer.uuid, name: { not: OFFLINE_PROVIDER.name } },
		orderBy: { id: "asc" },
	});
	if (!live) throw new Error("No provider holds the playable tracks: create one first, or pass --provider=<uuid>");

	const restrictedArg = option("restricted-provider");
	const restricted = await prisma.provider.findFirst({
		where: restrictedArg
			? { uuid: restrictedArg }
			: {
				uuid: { not: live.uuid },
				ownerUUID: { not: viewer.uuid },
				name: { not: OFFLINE_PROVIDER.name },
				users: { none: { userUUID: viewer.uuid } },
			},
		orderBy: { id: "asc" },
	});

	await prisma.playlist.deleteMany({ where: { name: { startsWith: MOCK_PREFIX } } });

	const offline = await prisma.provider.upsert({
		where: { name: OFFLINE_PROVIDER.name },
		update: {},
		create: { ...OFFLINE_PROVIDER, ownerUUID: viewer.uuid, hashedKey: randomBytes(32).toString("hex") },
	});
	const listener = await prisma.user.upsert({
		where: { email: MOCK_USER_EMAIL },
		update: {},
		create: {
			email: MOCK_USER_EMAIL,
			username: "Mock listener",
			password: await bcrypt.hash(randomBytes(24).toString("hex"), 10),
			emailValidated: true,
		},
	});

	const create = async (ownerUUID: string, name: string, isPrivate: boolean, tracks: [string, string][]) => {
		const playlist = await prisma.playlist.create({ data: { name: MOCK_PREFIX + name, ownerUUID, private: isPrivate } });
		for (const [musicUUID, providerUUID] of tracks) {
			await prisma.playlistMusic.create({ data: { playlistUUID: playlist.uuid, musicUUID, providerUUID } });
		}
		console.log(`  ${playlist.private
			? "private"
			: "public "}  /playlist/${playlist.uuid}  ${playlist.name} (${tracks.length} tracks)`);
		return playlist;
	};

	console.log(`Account ${viewer.email}, playable tracks on "${live.name}"`);
	await create(viewer.uuid, "All track states", false, [
		[PLAYABLE[0], live.uuid],
		[missing(1), live.uuid],
		...restricted
			? [[elsewhere(1), restricted.uuid] as [string, string]]
			: [],
		[PLAYABLE[1], live.uuid],
		[elsewhere(2), offline.uuid],
		[PLAYABLE[2], live.uuid],
		[missing(2), live.uuid],
	]);
	await create(viewer.uuid, "Private mix", true, PLAYABLE.map((uuid): [string, string] => [uuid, live.uuid]));
	await create(viewer.uuid, "Empty playlist", false, []);

	const followed = await create(listener.uuid, "Followed playlist", false, [
		[PLAYABLE[2], live.uuid],
		restricted
			? [elsewhere(3), restricted.uuid]
			: [elsewhere(3), offline.uuid],
		[PLAYABLE[0], live.uuid],
	]);
	await prisma.userPlaylist.create({ data: { userUUID: viewer.uuid, playlistUUID: followed.uuid } });
	console.log("  (the last playlist belongs to the mock listener and is followed by the account)");

	if (!restricted) {
		console.log("No provider found that this account has not joined, so there is no restricted track.");
		console.log("Create a provider with another account, or pass --restricted-provider=<uuid>, then run it again.");
	} else {
		console.log(`Restricted tracks live on "${restricted.name}"`);
	}
}

(args.includes("--clean")
	? clean()
	: seed())
	.catch((error: unknown) => {
		console.error(error instanceof Error
			? error.message
			: error);
		process.exitCode = 1;
	})
	.finally(() => prisma.$disconnect());
