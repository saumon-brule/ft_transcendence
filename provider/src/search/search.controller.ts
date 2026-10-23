import { Controller } from "@nestjs/common";
import { tsRestHandler, TsRestHandler } from "@ts-rest/nest";
import { providerContract } from "@flex/shared";
import { MemberOnly } from "../core/auth/auth.decorators";
import { SearchService } from "./search.service";

@Controller()
export class SearchController {
	constructor(private readonly searchService: SearchService) {}

	@TsRestHandler(providerContract.search.search)
	@MemberOnly()
	search() {
		return tsRestHandler(providerContract.search.search, async ({ query }) => ({
			status: 200,
			body: await this.searchService.search(query),
		}));
	}
}
