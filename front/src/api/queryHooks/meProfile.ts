import { API_URL } from "~/utils/constants";
import { client, queryKeys } from "../client";

export const useMeProfileQuery = () => client.users.me.createQuery(queryKeys.users.me, {}, {
	staleTime: 30_000,

	select: (data) => ({
		...data,
		body: {
			...data.body,
			avatarUrl: `${API_URL}/users/${data.body.uuid}/avatar?v=${data.body.avatarUpdatedAt.getTime()}`,
		},
	}),
});
