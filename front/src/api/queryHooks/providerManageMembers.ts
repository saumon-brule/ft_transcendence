import { Provider, providerContract } from "@flex/shared";
import { type ClientInferResponses } from "@ts-rest/core";
import { getProviderClient } from "../providerClients";
import { queryClient } from "../queryClient";
import { summonErrorToast } from "~/components/ui/Toaster";

type MembersResponse = ClientInferResponses<typeof providerContract.member.list, 200>;
type AccessRequestsResponse = ClientInferResponses<typeof providerContract.accessRequest.list, 200>;
type MemberListFilter = { revoked?: boolean };

export const useProviderMembersQuery = (providerData: Provider, filter: () => MemberListFilter = () => ({})) => {
	const provider = getProviderClient(providerData.address, providerData.uuid);

	return provider.client.member.list.createQuery(
		() => provider.keys.member.list([JSON.stringify(filter())]),
		{
			query: {
				get revoked() {
					const { revoked } = filter();
					return revoked === undefined ? undefined : revoked ? "true" as const : "false" as const;
				},
			},
		},
		{ staleTime: 30_000 },
	);
};


export const useProviderPendingMembersQuery = (providerData: Provider) => {
	const provider = getProviderClient(providerData.address, providerData.uuid);

	return provider.client.accessRequest.list.createQuery(
		() => provider.keys.accessRequest.list(), { query: { status: "PENDING" } }, { staleTime: 30_000 },
	);
};

export const providerUserAccessDecide = async (providerData: Provider, uuid: string, approved: boolean) => {
	const provider = getProviderClient(providerData.address, providerData.uuid);

	const res = await provider.client.accessRequest.decide.mutation({
		params: { uuid: uuid },
		body: { decision: approved ? "APPROVED" : "REJECTED" },
	});
	if (res.status === 409) {
		summonErrorToast("This request has already been decide");
	} else if (res.status === 403) {
		summonErrorToast("You dont have the permission to do that");
	} else if (res.status === 404) {
		summonErrorToast("This request does not exist");
	} else if (res.status !== 200) {
		summonErrorToast("An error occured");
	} else {
		queryClient.setQueriesData<AccessRequestsResponse>(
			{ queryKey: provider.keys.accessRequest.list() },
			(old) => old && {
				...old,
				body: { accessRequests: old.body.accessRequests.filter((r) => r.uuid !== res.body.uuid) },
			},
		);

		const newMember = res.body.member;
		if (!newMember) return;

		for (const [queryKey] of queryClient.getQueriesData<MembersResponse>({ queryKey: provider.keys.member.list() })) {
			const last = queryKey.at(-1);
			const filter = (typeof last === "string" ? JSON.parse(last) : {}) as MemberListFilter;
			if (filter.revoked === true) continue;

			queryClient.setQueryData<MembersResponse>(queryKey, (old) => old && {
				...old,
				body: {
					members: [
						...old.body.members.filter((m) => m.uuid !== newMember.uuid),
						newMember,
					],
				},
			});
		}

		return res.body;
	}
};

export const providerRemoveMember = async (providerData: Provider, uuid: string) => {
	const provider = getProviderClient(providerData.address, providerData.uuid);

	const res = await provider.client.member.revoke.mutation({
		params: { uuid: uuid },
	});
	if (res.status === 403) {
		summonErrorToast("You dont have the permission to do that");
	} else if (res.status === 404) {
		summonErrorToast("This member does not exist");
	} else if (res.status !== 204) {
		summonErrorToast("An error occured");
	} else {
		const memberQueries = queryClient.getQueriesData<MembersResponse>({ queryKey: provider.keys.member.list() });

		const previous = memberQueries
			.flatMap(([, data]) => data?.body.members ?? [])
			.find((m) => m.uuid === uuid);
		const revokedMember = previous && { ...previous, revokedAt: new Date(), roles: [] };

		for (const [queryKey] of memberQueries) {
			const last = queryKey.at(-1);
			const filter = (typeof last === "string" ? JSON.parse(last) : {}) as MemberListFilter;

			queryClient.setQueryData<MembersResponse>(queryKey, (old) => {
				if (!old) return old;
				const others = old.body.members.filter((m) => m.uuid !== uuid);

				if (filter.revoked === false || !revokedMember) return { ...old, body: { members: others } };
				if (filter.revoked === true) return { ...old, body: { members: [...others, revokedMember] } };
				return {
					...old,
					body: { members: old.body.members.map((m) => m.uuid === uuid ? revokedMember : m) },
				};
			});
		}
	}
};
