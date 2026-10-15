import { initContract } from "@ts-rest/core";
import { createProviderSchema, providerSchema } from "./schemas/provider.schema";
import { errorDefaultSchema } from "../schemas/error-default";

const c = initContract();

// Gestion des providers par leurs propriétaires (API des utilisateurs).
// Ne pas confondre avec contracts/server/providers (ce que les providers appellent) ni contracts/provider (l'API d'un provider).
export const providersContract = c.router(
	{
		create: {
			method: "POST",
			path: "/",
			body: createProviderSchema,
			responses: {
				201: providerSchema,
				409: errorDefaultSchema,
			},
		},
	},
	{ pathPrefix: "/providers" },
);
