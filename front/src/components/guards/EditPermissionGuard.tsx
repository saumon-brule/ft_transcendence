import { useNavigate, RouteSectionProps } from "@solidjs/router";
import { createContext, createEffect, Show, useContext } from "solid-js";
import { useProviderInfoInfoQuery } from "~/api/queryHooks/providerAccess";
import { useProvider } from "./ProviderInfoGuard";

const AllowedContext = createContext<Exclude<ReturnType<typeof useProviderInfoInfoQuery>["data"], undefined>["body"]>();

export function useProviderInfoInfo() {
	const ctx = useContext(AllowedContext);
	if (!ctx) throw new Error("useProviderInfoInfo should only be used with EditPermissionGuard parent.");
	return ctx;
}

export default function EditPermissionGuard(props: RouteSectionProps) {
	const navigate = useNavigate();
	const provider = useProvider();
	const providerInfoInfoQuery = useProviderInfoInfoQuery(() => provider);

	createEffect(() => {
		if (providerInfoInfoQuery?.data?.body.member.permissions.length === 0) navigate("/home", { replace: true });
	});

	return <Show when={(providerInfoInfoQuery?.data?.body.member.permissions.length ?? 0) > 0 && providerInfoInfoQuery?.data?.body}>
		{(providerInfoInfoData) => <AllowedContext.Provider value={providerInfoInfoData()}>
			{props.children}
		</AllowedContext.Provider>}
	</Show>;
}
