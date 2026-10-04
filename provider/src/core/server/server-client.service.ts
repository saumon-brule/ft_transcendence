export interface ProviderIdentity {
	uuid: string;
	ownerUuid: string;
}

export class ServerAuthError extends Error {}

export abstract class ServerClientService {
	abstract getIdentity(): Promise<ProviderIdentity>;
	abstract getPublicKey(): Promise<string>;
}
