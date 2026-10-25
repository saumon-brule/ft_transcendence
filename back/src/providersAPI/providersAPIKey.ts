import { createHash, randomBytes } from "node:crypto";

const UUID = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
const API_KEY_PATTERN = new RegExp(`^flex_(${UUID})_([A-Za-z0-9_-]{43})$`);

function hashSecret(secret: string) {
	return createHash("sha256").update(secret).digest("hex");
}

export function generateApiKey(providerUuid: string) {
	const secret = randomBytes(32).toString("base64url");
	return { key: `flex_${providerUuid}_${secret}`, keyHash: hashSecret(secret) };
}

export function parseApiKey(rawKey: string) {
	const match = API_KEY_PATTERN.exec(rawKey);
	if (!match) return null;

	return { providerUuid: match[1].toLowerCase(), keyHash: hashSecret(match[2]) };
}
