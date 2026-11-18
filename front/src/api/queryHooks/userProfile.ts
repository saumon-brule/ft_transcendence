import { env } from "~/env";
import { client, queryKeys } from "../client";

export const useUserProfileQuery = (uuid: () => string) => client.users.getUser.createQuery(
	() => queryKeys.users.getUser([uuid()]),
	{ params: { get uuid() { return uuid(); } } },
	{
		select: (data) => ({
			...data,
			body: {
				...data.body,
				avatarUrl: `${env.VITE_API_URL}/users/${data.body.uuid}/avatar`,
			},
		}),
	},
);

export const getUsersBatch = async (uuids: string[]) => {
	const res = await client.users.getUsers.mutation({ body: { uuids } });
	if (res.status !== 200) throw Error("Cannot get users");
	return {
		...res.body,
		users: res.body.users.map((u) => ({
			...u,
			avatarUrl: `${env.VITE_API_URL}/users/${u.uuid}/avatar`,
		})),
	};
};
