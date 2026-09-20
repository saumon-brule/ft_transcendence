import { Injectable } from '@nestjs/common';

@Injectable()
export class ServerClientService {
	async getIdentity() {
		return {
			uuid: "00000000-0000-4000-8000-000000000001",
			ownerUuid: "00000000-0000-4000-8000-000000000002",
		};
	}
}
