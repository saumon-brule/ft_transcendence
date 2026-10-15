import { Injectable } from "@nestjs/common";
import { createPrivateKey, createPublicKey, generateKeyPairSync, KeyObject } from "node:crypto";
import { env } from "../core/env";
import { WinstonLoggerService } from "../core/logging/logger.service";

const MIN_MODULUS_BITS = 2048;

/**
 * Paire de clés RSA avec laquelle le server signe (RS256) les tokens d'accès aux providers.
 * Seule la clé PRIVÉE est configurée ; la clé publique en est déduite, donc les deux ne peuvent jamais diverger.
 */
@Injectable()
export class ProviderSigningKeyService {
	private readonly privateKey: KeyObject;
	private readonly publicKeyPem: string;

	constructor(logger: WinstonLoggerService) {
		this.privateKey = env.PROVIDER_TOKEN_PRIVATE_KEY
			? this.loadPrivateKey(env.PROVIDER_TOKEN_PRIVATE_KEY)
			: this.generateEphemeralKey(logger);

		this.publicKeyPem = createPublicKey(this.privateKey)
			.export({ type: "spki", format: "pem" })
			.toString();
	}

	getPublicKeyPem() {
		return this.publicKeyPem;
	}

	private loadPrivateKey(pem: string) {
		let key: KeyObject;
		try {
			// Dans un .env, la clé tient sur une ligne avec des "\n" littéraux
			key = createPrivateKey(pem.replace(/\\n/g, "\n"));
		} catch {
			throw new Error("PROVIDER_TOKEN_PRIVATE_KEY is not a valid private key in PEM format");
		}

		const bits = key.asymmetricKeyDetails?.modulusLength ?? 0;
		if (key.asymmetricKeyType !== "rsa" || bits < MIN_MODULUS_BITS) {
			throw new Error(`PROVIDER_TOKEN_PRIVATE_KEY must be an RSA key of at least ${MIN_MODULUS_BITS} bits`);
		}
		return key;
	}

	private generateEphemeralKey(logger: WinstonLoggerService) {
		// Possible seulement hors production : env.ts exige la variable quand NODE_ENV=prod
		logger.warn(
			"PROVIDER_TOKEN_PRIVATE_KEY is not set: using a temporary key, valid until the next restart",
			ProviderSigningKeyService.name,
		);
		return generateKeyPairSync("rsa", { modulusLength: 3072 }).privateKey;
	}
}
