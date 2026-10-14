import { env } from "~/env";
import { client, queryKeys } from "../client";

export const useMeProfileQuery = () => client.users.me.createQuery(queryKeys.users.me, {}, {
	select: (data) => ({
		...data,
		body: {
			...data.body,
			avatarUrl: `${env.VITE_API_URL}/users/${data.body.uuid}/avatar?v=${data.body.avatarUpdatedAt.getTime()}`,
		},
	}),
});
