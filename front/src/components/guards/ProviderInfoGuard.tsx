import { useNavigate, RouteSectionProps, useParams } from "@solidjs/router";
import { createContext, createEffect, Show, useContext } from "solid-js";
import { client, queryKeys } from "~/api/client";
import { summonErrorToast } from "../ui/Toaster";
import { Provider } from "@flex/shared";
import LoadingSplash from "~/pages/Loading/LoadingSplash";

const ProviderInfoContext = createContext<Provider>();

export function useProvider() {
	const ctx = useContext(ProviderInfoContext);
	if (!ctx) throw new Error("useProviderInfo should only be used with ProviderInfoGuard parent.");
	return ctx;
}

export default function ProviderInfoGuard(props: RouteSectionProps) {
	const navigate = useNavigate();
	const params = useParams<{ uuid: string }>();
	const providerQuery = client.providers.get.createQuery(() => queryKeys.providers.get([params.uuid]), { params: { get uuid() { return params.uuid; } } });
	const provider = () => providerQuery.data?.body ?? null;

	createEffect(() => {
		if (!providerQuery.isError) return;
		const status = (providerQuery.error as { status?: number } | null)?.status;
		summonErrorToast(status === 404 || status === 400 ? "Unknown provider" : "Failed to load provider");
		navigate("/home", { replace: true });
	});

	return <Show when={provider()} keyed fallback={<LoadingSplash/>}>
		{(providerInfo) => <ProviderInfoContext.Provider value={providerInfo}>
			{props.children}
		</ProviderInfoContext.Provider>}
	</Show>;
}
