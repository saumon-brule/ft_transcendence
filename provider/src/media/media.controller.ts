import { Controller } from "@nestjs/common";
import { tsRestHandler, TsRestHandler } from "@ts-rest/nest";
import { providerContract } from "@flex/shared";
import { CurrentMember, MemberOnly } from "../core/auth/auth.decorators";
import type { MemberContext } from "../core/auth/auth.types";
import { MediaTokenService } from "./media-token.service";

@Controller()
export class MediaController {
	constructor(private readonly tokens: MediaTokenService) {}

	@TsRestHandler(providerContract.media.token)
	@MemberOnly()
	token(@CurrentMember() member: MemberContext) {
		return tsRestHandler(providerContract.media.token, async () => ({
			status: 200,
			body: await this.tokens.issue(member.uuid),
		}));
	}
}
