import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { generateKeyPairSync } from "node:crypto";
import { env } from "../env";

const PROVIDER_UUID = "00000000-0000-4000-8000-000000000001";
const OWNER_UUID = "00000000-0000-4000-8000-000000000002";
const VISITOR_UUID = "00000000-0000-4000-8000-000000000003";

@Injectable()
export class ServerClientService implements OnApplicationBootstrap {
	private readonly keys = generateKeyPairSync("rsa", {
		modulusLength: 2048,
		publicKeyEncoding: { type: "spki", format: "pem" },
		privateKeyEncoding: { type: "pkcs8", format: "pem" },
	});

	constructor(private readonly jwt: JwtService) {}

	private assertMock() {
		if (env.NODE_ENV === "prod") {
			throw new Error("ServerClientService is still a mock");
		}
	}

	async getIdentity() {
		this.assertMock();
		return { uuid: PROVIDER_UUID, ownerUuid: OWNER_UUID };
	}

	async getPublicKey() {
		this.assertMock();
		return this.keys.publicKey;
	}

	private signDevToken(userUuid: string) {
		return this.jwt.signAsync({}, {
			privateKey: this.keys.privateKey,
			algorithm: "RS256",
			subject: userUuid,
			audience: PROVIDER_UUID,
			expiresIn: "12h",
		});
	}

	async onApplicationBootstrap() {
		if (env.NODE_ENV !== "dev") return;
		console.log(`[dev] owner token   : ${await this.signDevToken(OWNER_UUID)}`);
		console.log(`[dev] visitor token : ${await this.signDevToken(VISITOR_UUID)}`);
	}
}
