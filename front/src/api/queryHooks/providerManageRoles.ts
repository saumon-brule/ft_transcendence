import { Provider, ProviderPermission, providerContract } from "@flex/shared";
import { type ClientInferResponses } from "@ts-rest/core";
import { getProviderClient } from "../providerClients";
import { queryClient } from "../queryClient";
import { summonErrorToast } from "~/components/ui/feedback/Toaster";
import { t } from "~/i18n/context";

export type RolesResponse = ClientInferResponses<typeof providerContract.role.list, 200>;

export const useProviderRolesQuery = (providerData: Provider) => {
	const provider = getProviderClient(providerData.address, providerData.uuid);

	return provider.client.role.list.createQuery(() => provider.keys.role.list(), {}, { staleTime: 30_000 });
};

export const providerCreateRole = async (providerData: Provider, name: string, permissions: Array<ProviderPermission>) => {
	const provider = getProviderClient(providerData.address, providerData.uuid);

	const res = await provider.client.role.create.mutation({ body: { name, permissions } });
	if (res.status === 409) {
		summonErrorToast(t("toasts.roles.nameConflict"));
	} else if (res.status === 403) {
		summonErrorToast(t("errors.noPermission"));
	} else if (res.status !== 201) {
		summonErrorToast(t("errors.generic"));
	} else {
		queryClient.setQueryData<RolesResponse>(provider.keys.role.list(), (old) => old && {
			...old,
			body: { roles: [...old.body.roles, res.body] },
		});
		return true;
	}
	return false;
};

export const providerUpdateRole = async (providerData: Provider, uuid: string, name: string, permissions: Array<ProviderPermission>) => {
	const provider = getProviderClient(providerData.address, providerData.uuid);

	const res = await provider.client.role.update.mutation({ params: { uuid }, body: { name, permissions } });
	if (res.status === 409) {
		summonErrorToast(t("toasts.roles.nameConflict"));
	} else if (res.status === 403) {
		summonErrorToast(t("errors.noPermission"));
	} else if (res.status === 404) {
		summonErrorToast(t("toasts.roles.notFound"));
	} else if (res.status !== 200) {
		summonErrorToast(t("errors.generic"));
	} else {
		queryClient.setQueryData<RolesResponse>(provider.keys.role.list(), (old) => old && {
			...old,
			body: { roles: old.body.roles.map((r) => r.uuid === res.body.uuid ? res.body : r) },
		});
		return true;
	}
	return false;
};

export const deleteRole = async (providerData: Provider, uuid: string) => {
	const provider = getProviderClient(providerData.address, providerData.uuid);

	const res = await provider.client.role.remove.mutation({ params: { uuid } });
	if (res.status === 403) {
		summonErrorToast(t("errors.noPermission"));
	} else if (res.status === 404) {
		summonErrorToast(t("toasts.roles.notFound"));
	} else if (res.status !== 204) {
		summonErrorToast(t("errors.generic"));
	} else {
		queryClient.setQueryData<RolesResponse>(provider.keys.role.list(), (old) => old && {
			...old,
			body: { roles: old.body.roles.filter((r) => r.uuid !== uuid) },
		});
		return true;
	}
	return false;
};

