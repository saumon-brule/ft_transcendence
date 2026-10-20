import { CommonCode429 } from "@flex/shared";
import { HttpException, HttpStatus } from "@nestjs/common";

export class TooManyRequestsException extends HttpException {
	constructor(code: CommonCode429 = "RATE_LIMITED", message?: string) {
		super({ message: message ?? "Too many requests", code }, HttpStatus.TOO_MANY_REQUESTS);
	}
}
