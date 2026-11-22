import { createMutation, createQuery, useQueryClient } from "@tanstack/solid-query";
import { client } from "../client";
import { getProviderClient } from "../providerClients";
import { summonErrorToast, summonSuccessToast } from "~/components/ui/feedback/Toaster";
import { Provider } from "@flex/shared";
import { t } from "~/i18n/context";

export type JoinStatus = "PENDING" | "APPROVED" | "REJECTED";

export const useAccessRequestQuery = (provider: () => Provider) => {
	const providerClient = () => getProviderClient(provider().address, provider().uuid);

	return createQuery({
		queryKey: () => providerClient().keys.accessRequest.me(),
		queryFn: async (): Promise<JoinStatus | null> => {
			const res = await providerClient().client.accessRequest.me.query();
			if (res.status === 200) return res.body.accessRequest?.status ?? null;
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
		mutationFn: async (provider: Provider): Promise<JoinStatus> => {
			const requested = await client.providers.initiateAccessRequest.mutation({ params: { uuid: provider.uuid } });
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

export const useLeaveProviderMutation = (provider: () => Provider) => {
	const queryClient = useQueryClient();

	return getProviderClient(provider().address, provider().uuid).client.member.leave.createMutation({
		onSuccess: async () => {
			summonSuccessToast(t("toasts.provider.left"));
			await queryClient.invalidateQueries({ queryKey: ["provider", provider().uuid] });
		},
		onError: () => { summonErrorToast(t("errors.generic")); },
	});
};

export const useProviderInfoInfoQuery = (provider: () => Provider) => {
	const providerClient = getProviderClient(provider().address, provider().uuid);
	return providerClient.client.info.info.createQuery(
		providerClient.keys.info.info,
		{},
		{
			retry: (failureCount, error) => error instanceof TypeError && failureCount < 3,
			onError: () => { summonErrorToast(t("errors.generic")); },
		},
	);
};
