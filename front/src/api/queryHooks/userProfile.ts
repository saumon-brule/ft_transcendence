import { env } from "~/env";
import { client, queryKeys } from "../client";

export const useUserProfileQuery = (uuid: string) => client.users.getUser.createQuery(queryKeys.users.getUser, { params: { uuid: uuid } }, {
	select: (data) => ({
		...data,
		body: {
			...data.body,
			avatarUrl: `${env.VITE_API_URL}/users/${data.body.uuid}/avatar`,
		},
	}),
});
