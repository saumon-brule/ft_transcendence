import { initContract } from "@ts-rest/core";
import { authContract } from "./auth/auth.contract";
import { usersContract } from "./users/users.contract";
import { rolesContract } from "./roles/roles.contract";
import { permissionsContract } from "./permissions/permissions.contract";
import { playlistsContract } from "./playlists/playlists.contract";
import { commonError400Schema, commonError429Schema, serverBaseError401Schema, serverError403Schema } from "../../errors/error-schemas";
import { appConfigContract } from "./appConfig/app-config.contract";
import { providersAPIContract } from "./providersAPI/providersAPI.contract";
import { providersContract } from "./providers/providers.contract";
import { friendsContract } from "./users/friends.contract";

const c = initContract();

export const appContract = c.router(
	{
		auth: authContract,
		users: usersContract,
		roles: rolesContract,
		permissions: permissionsContract,
		config: appConfigContract,
		playlists: playlistsContract,
		providersAPI: providersAPIContract,
		providers: providersContract,
		friends: friendsContract,
	},
	{
		// Pour ceux qui se demandent, la difference entre 401 Unauthorized et 403 Forbidden :
		// 401, t'as pas la perm et le serveur te connais pas -> plus de token, mot de passe invalide
		// 403, t'as pas la perm et le serveur te connais -> email non valide, permission invalide
		commonResponses: {
			400: commonError400Schema,
			401: serverBaseError401Schema,
			403: serverError403Schema,
			429: commonError429Schema,
		},
	},
);
