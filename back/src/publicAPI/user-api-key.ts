import { createHash, randomBytes } from "node:crypto";

export function hashUserApiKey(key: string) {
	return createHash("sha256").update(key).digest("hex");
}

export function generateUserApiKey() {
	const key = randomBytes(32).toString("base64url");
	return { key, keyHash: hashUserApiKey(key) };
}
