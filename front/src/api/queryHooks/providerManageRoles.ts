import { Provider } from "@flex/shared";
import { getProviderClient } from "../providerClients";

export const useProviderRolesQuery = (providerData: Provider) => {
	const provider = getProviderClient(providerData.address, providerData.uuid);

	return provider.client.role.list.createQuery(() => provider.keys.role.list(), {}, { staleTime: 30_000 });
};
