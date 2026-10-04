import { HttpException, Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { initClient } from "@ts-rest/core";
import { serverContract } from "@flex/shared";
import { env } from "../env";
import { ProviderIdentity, ServerAuthError, ServerClientService } from "./server-client.service";

const REQUEST_TIMEOUT_MS = 5_000;
const PUBLIC_KEY_TTL_MS = 5 * 60 * 1_000;

@Injectable()
export class HttpServerClientService extends ServerClientService {
	private readonly logger = new Logger(HttpServerClientService.name);

	private readonly client = initClient(serverContract, {
		baseUrl: env.FLEX_SERVER_URL,
		baseHeaders: { authorization: `Bearer ${env.FLEX_API_KEY}` },
		validateResponse: true,
	});

	private cachedKey: { value: string; expiresAt: number } | undefined;
	private pendingKey: Promise<string> | undefined;

	private timeout() {
		return { fetchOptions: { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) } };
	}

	private fail(what: string, status: number): never {
		if (status === 401 || status === 403) {
			throw new ServerAuthError(`${what}: the server refused our API key (${status}), check FLEX_API_KEY`);
		}
		throw new ServiceUnavailableException(`${what}: unexpected server status ${status}`);
	}

	private async request<T>(what: string, run: () => Promise<T>): Promise<T> {
		try {
			return await run();
		} catch (error) {
			if (error instanceof ServerAuthError || error instanceof HttpException) throw error;
			throw new ServiceUnavailableException(`${what}: cannot reach the server (${(error as Error).message})`);
		}
	}

	async getIdentity(): Promise<ProviderIdentity> {
		return this.request("provider identity", async () => {
			const response = await this.client.providers.provider(this.timeout());
			if (response.status !== 200) this.fail("provider identity", response.status);

			return response.body;
		});
	}

	async getPublicKey(): Promise<string> {
		const cached = this.cachedKey;
		if (cached && cached.expiresAt > Date.now()) return cached.value;

		this.pendingKey ??= this.fetchPublicKey().finally(() => {
			this.pendingKey = undefined;
		});
		return this.pendingKey;
	}

	private fetchPublicKey(): Promise<string> {
		return this.request("server public key", async () => {
			const response = await this.client.providers.publicKey(this.timeout());
			if (response.status !== 200) this.fail("server public key", response.status);

			this.cachedKey = {
				value: response.body.publicKey,
				expiresAt: Date.now() + PUBLIC_KEY_TTL_MS,
			};
			this.logger.log("Fetched the server public key");
			return this.cachedKey.value;
		});
	}
}
