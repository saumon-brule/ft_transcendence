import { API_URL } from "~/utils/constants";
import { client, queryKeys } from "../client";

export const useUserProfileQuery = (uuid: () => string) => client.users.getUser.createQuery(() => queryKeys.users.getUser([uuid()]), {
	params: { get uuid() { return uuid(); } },
}, {
	select: (data) => ({
		...data,
		body: {
			...data.body,
			avatarUrl: `${API_URL}/users/${data.body.uuid}/avatar`,
		},
	}),
});
