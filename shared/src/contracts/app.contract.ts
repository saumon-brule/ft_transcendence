import { initContract } from "@ts-rest/core";
import { authContract } from "./auth/auth.contract";
import { usersContract } from "./users/users.contract";
import { rolesContract } from "./roles/roles.contract";
import { permissionsContract } from "./permissions/permissions.contract";
import { playlistsContract } from "./playlists/playlists.contract";
import { error401BaseSchema } from "./schemas/error401";
import { error403Schema } from "./schemas/error403";
import { error400Schema } from "./schemas/error400";
import { error429Schema } from "./schemas/error429";
import { appConfigContract } from "./appConfig/app-config.contract";

const c = initContract();

export const appContract = c.router(
	{
		auth: authContract,
		users: usersContract,
		roles: rolesContract,
		permissions: permissionsContract,
		config: appConfigContract,
		playlists: playlistsContract,
	},
	{
		// Pour ceux qui se demandent, la difference entre 401 Unauthorized et 403 Forbidden :
		// 401, t'as pas la perm et le serveur te connais pas -> plus de token, mot de passe invalide
		// 403, t'as pas la perm et le serveur te connais -> email non valide, permission invalide
		commonResponses: {
			400: error400Schema,
			401: error401BaseSchema,
			403: error403Schema,
			429: error429Schema,
		},
	},
);
