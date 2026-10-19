import { ProviderCode403 } from "@flex/shared";
import { ForbiddenException } from "@nestjs/common";

export class AppForbiddenException extends ForbiddenException {
	constructor(code: ProviderCode403, message?: string) {
		super({ message: message ?? "Forbidden", code });
	}
}
