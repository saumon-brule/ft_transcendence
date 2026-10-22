import { ProviderCode409 } from "@flex/shared";
import { ConflictException } from "@nestjs/common";

export class AppConflictException extends ConflictException {
	constructor(code: ProviderCode409, message?: string) {
		super({ message: message ?? "Conflict", code });
	}
}
