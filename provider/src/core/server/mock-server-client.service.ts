import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { generateKeyPairSync } from "node:crypto";
import { ProviderIdentity, ServerClientService } from "./server-client.service";

const PROVIDER_UUID = "00000000-0000-4000-8000-000000000001";
const OWNER_UUID = "00000000-0000-4000-8000-000000000002";
const VISITOR_UUID = "00000000-0000-4000-8000-000000000003";

@Injectable()
export class MockServerClientService extends ServerClientService implements OnApplicationBootstrap {
	private readonly logger = new Logger(MockServerClientService.name);

	private readonly keys = generateKeyPairSync("rsa", {
		modulusLength: 2048,
		publicKeyEncoding: { type: "spki", format: "pem" },
		privateKeyEncoding: { type: "pkcs8", format: "pem" },
	});

	constructor(private readonly jwt: JwtService) {
		super();
	}

	async getIdentity(): Promise<ProviderIdentity> {
		return { uuid: PROVIDER_UUID, ownerUuid: OWNER_UUID };
	}

	async getPublicKey(): Promise<string> {
		return this.keys.publicKey;
	}

	private signAccessToken(userUuid: string) {
		return this.jwt.signAsync({}, {
			privateKey: this.keys.privateKey,
			algorithm: "RS256",
			subject: userUuid,
			audience: PROVIDER_UUID,
			expiresIn: "12h",
		});
	}

	async onApplicationBootstrap() {
		this.logger.warn("Using a FAKE server (FLEX_SERVER_MOCK=true), tokens below are for testing only");
		this.logger.log(`owner token   : ${await this.signAccessToken(OWNER_UUID)}`);
		this.logger.log(`visitor token : ${await this.signAccessToken(VISITOR_UUID)}`);
	}
}
