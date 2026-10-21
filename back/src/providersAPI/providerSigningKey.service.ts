import { Injectable } from "@nestjs/common";
import { createPrivateKey, createPublicKey, generateKeyPairSync, KeyObject } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { env } from "../core/env";
import { PROVIDER_KEY_PATH } from "../core/utils/constants";
import { WinstonLoggerService } from "../core/logging/logger.service";

const MIN_MODULUS_BITS = 2048;

@Injectable()
export class ProviderSigningKeyService {
	private readonly privateKey: KeyObject;
	private readonly publicKeyPem: string;

	constructor(logger: WinstonLoggerService) {
		this.privateKey = existsSync(PROVIDER_KEY_PATH)
			? this.loadPrivateKey(readFileSync(PROVIDER_KEY_PATH, "utf8"))
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
			key = createPrivateKey(pem);
		} catch {
			throw new Error(`${PROVIDER_KEY_PATH} is not a valid private key in PEM format`);
		}

		const bits = key.asymmetricKeyDetails?.modulusLength ?? 0;
		if (key.asymmetricKeyType !== "rsa" || bits < MIN_MODULUS_BITS) {
			throw new Error(`${PROVIDER_KEY_PATH} must be an RSA key of at least ${MIN_MODULUS_BITS} bits`);
		}
		return key;
	}

	private generateEphemeralKey(logger: WinstonLoggerService) {
		if (env.NODE_ENV === "prod") {
			throw new Error(`${PROVIDER_KEY_PATH} is required when NODE_ENV=prod`);
		}
		logger.warn(
			`${PROVIDER_KEY_PATH} not found: using a temporary key, valid until the next restart`,
			ProviderSigningKeyService.name,
		);
		return generateKeyPairSync("rsa", { modulusLength: 3072 }).privateKey;
	}
}
