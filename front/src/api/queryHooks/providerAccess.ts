import { createMutation, createQuery, useQueryClient } from "@tanstack/solid-query";
import { client } from "../client";
import { getProviderClient } from "../providerClients";
import { summonErrorToast } from "~/components/ui/Toaster";

interface ProviderRef {
	uuid: string;
	address: string;
}

export type JoinStatus = "PENDING" | "APPROVED" | "REJECTED";

export const useAccessRequestQuery = (provider: () => ProviderRef) => {
	const providerClient = () => getProviderClient(provider().address, provider().uuid);

	return createQuery({
		queryKey: () => providerClient().keys.accessRequest.me(),
		queryFn: async (): Promise<JoinStatus | null> => {
			const res = await providerClient().client.accessRequest.me.query();
			if (res.status === 200) return res.body.status;
			if (res.status === 404) return null;
			throw new Error(`Access request lookup failed with status ${res.status}`);
		},
		staleTime: 30_000,
	});
};

// Joining is a two step protocol: the server records the request, then the provider checks it with the server
// and either approves right away (public provider) or keeps it pending for its managers.
export const useJoinProvider = () => {
	const queryClient = useQueryClient();

	return createMutation({
		mutationFn: async (provider: ProviderRef): Promise<JoinStatus> => {
			const requested = await client.providers.requestAccess.mutation({ params: { uuid: provider.uuid } });
			if (requested.status === 409) throw new Error("The server already considers you a member of this provider");
			if (requested.status !== 200) throw new Error(`Access request failed with status ${requested.status}`);

			const created = await getProviderClient(provider.address, provider.uuid).client.accessRequest.create.mutation();
			if (created.status === 201) return created.body.status;
			if (created.status === 409) return created.body.code === "ALREADY_PENDING"
				? "PENDING"
				: "APPROVED";
			throw new Error(`Provider access request failed with status ${created.status}`);
		},
		onSuccess: (_status, provider) => queryClient.invalidateQueries({ queryKey: ["provider", provider.uuid] }),
		onError: (error) => { summonErrorToast((error as Error).message); },
	});
};
