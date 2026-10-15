import { initContract } from "@ts-rest/core";
import { serverProvidersContract } from "./providers/providers.contract";

const c = initContract();

export const serverContract = c.router(
	{
		providers: serverProvidersContract,
	},
);
