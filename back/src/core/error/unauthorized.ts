import { ServerCode401 } from "@flex/shared";
import { UnauthorizedException } from "@nestjs/common";

export class AppUnauthorizedException extends UnauthorizedException {
	constructor(code: ServerCode401, message?: string) {
		super({ message: message ?? "Unauthorized", code });
	}
}
