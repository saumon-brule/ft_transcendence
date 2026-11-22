import { summonErrorToast } from "~/components/ui/feedback/Toaster";
import { getProviderClient } from "../providerClients";
import { queryClient } from "../queryClient";
import { Provider, type ProviderDataDto, type ProviderInfoDto } from "@flex/shared";
import { RolesResponse } from "./providerManageRoles";
import { t } from "~/i18n/context";

export const providerUpdateSettings = async (providerData: Provider, visibility?: "PUBLIC" | "PRIVATE", defaultRoleUuid?: string) => {
	const provider = getProviderClient(providerData.address, providerData.uuid);

	const res = await provider.client.setting.update.mutation({ body: { visibility, defaultRoleUuid } });
	if (res.status === 403) {
		summonErrorToast(t("errors.noPermission"));
	} else if (res.status !== 200) {
		summonErrorToast(t("errors.generic"));
	} else {
		if (defaultRoleUuid) {
			queryClient.setQueryData<RolesResponse>(provider.keys.role.list(), (old) => old && {
				...old,
				body: { roles: old.body.roles.map((r) => r.uuid === defaultRoleUuid ? { ...r, isDefault: true } : { ...r, isDefault: false }) },
			});
		}
		if (visibility) {
			queryClient.setQueryData<{ status: 200; body: ProviderInfoDto }>(provider.keys.info.info(), (old) => old && {
				...old,
				body: { ...old.body, visibility },
			});
			queryClient.setQueryData<{ status: 200; body: ProviderDataDto }>(provider.keys.info.all(), (old) => old && {
				...old,
				body: { ...old.body, visibility },
			});
		}
		return true;
	}
	return false;
};
