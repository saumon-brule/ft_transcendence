// Gestion des clés API des providers, en ligne de commande (aucune route utilisateur n'existe encore pour ça).
//
//   pnpm --filter @flex/back exec ts-node --transpile-only src/providers/provider-api-key.cli.ts create "<uuid ou nom du provider>"
//   pnpm --filter @flex/back exec ts-node --transpile-only src/providers/provider-api-key.cli.ts list   "<uuid ou nom du provider>"
//   pnpm --filter @flex/back exec ts-node --transpile-only src/providers/provider-api-key.cli.ts revoke "<uuid de la clé>"
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { generateApiKey } from "./provider-api-key";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COMMANDS = ["create", "list", "revoke"];

function fail(message: string): never {
	console.error(message);
	process.exit(1);
}

async function main() {
	const [command, target] = process.argv.slice(2);
	if (!COMMANDS.includes(command) || !target) {
		fail("Usage : <create|list> <uuid ou nom du provider>  |  revoke <uuid de la clé>");
	}
	if (!process.env.DATABASE_URL) {
		fail("DATABASE_URL is not set");
	}

	const prisma = new PrismaClient({
		adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
	});

	try {
		if (command === "revoke") {
			const { count } = await prisma.providerApiKey.updateMany({
				where: { uuid: target, revokedAt: null },
				data: { revokedAt: new Date() },
			});
			if (count === 0) fail("No active API key with this uuid");
			console.log("API key revoked");
			return;
		}

		const provider = await prisma.provider.findFirst({
			where: UUID.test(target)
				? { uuid: target.toLowerCase() }
				: { name: target },
		});
		if (!provider) fail(`Provider not found: ${target}`);

		if (command === "list") {
			const keys = await prisma.providerApiKey.findMany({
				where: { providerId: provider.id },
				orderBy: { createdAt: "asc" },
			});
			console.log(`Provider "${provider.name}" (${provider.uuid}) : ${keys.length} key(s)`);
			for (const key of keys) {
				const status = key.revokedAt
					? `revoked ${key.revokedAt.toISOString()}`
					: "active";
				const lastUsed = key.lastUsedAt?.toISOString() ?? "never";
				console.log(`  ${key.uuid}  ${status}  created ${key.createdAt.toISOString()}  last used ${lastUsed}`);
			}
			return;
		}

		const { key, keyHash } = generateApiKey(provider.uuid);
		const created = await prisma.providerApiKey.create({
			data: { providerId: provider.id, keyHash },
			select: { uuid: true },
		});
		console.log(`Provider "${provider.name}" (${provider.uuid})`);
		console.log(`Key uuid : ${created.uuid}   (pour la révoquer)`);
		console.log("This key is shown ONLY ONCE, put it in the provider's FLEX_API_KEY:");
		console.log(key);
	} finally {
		await prisma.$disconnect();
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
