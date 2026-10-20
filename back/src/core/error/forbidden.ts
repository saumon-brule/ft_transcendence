import { ServerCode403 } from "@flex/shared";
import { ForbiddenException } from "@nestjs/common";

export class AppForbiddenException extends ForbiddenException {
	constructor(code: ServerCode403, message?: string) {
		super({ message: message ?? "Forbidden", code });
	}
}
