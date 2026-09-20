import { initContract } from "@ts-rest/core";
import { providersContract } from "./providers/providers.contract";

const c = initContract();

export const serverContract = c.router(
	{
		providers: providersContract,
	},
);
