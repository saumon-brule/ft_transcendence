import { useNavigate, RouteSectionProps, useLocation } from "@solidjs/router";
import { createContext, createEffect, Show, useContext } from "solid-js";
import { auth, AuthenticatedState } from "~/store/auth.store";
import { getAuthTarget } from "~/utils/getAuthTarget";
import ProfileGate from "./ProfileGate";

const AuthenticatedContext = createContext<AuthenticatedState>();

export function useAuth() {
	const ctx = useContext(AuthenticatedContext);
	if (!ctx) throw new Error("useAuth should only be used with AuthGuard parent.");
	return ctx;
}

export default function AuthGuard(props: RouteSectionProps) {
	const navigate = useNavigate();
	const location = useLocation();

	createEffect(() => {
		if (!auth.accessToken) navigate(`/login?authTarget=${getAuthTarget(location)}`, { replace: true });
	});

	return <Show when={auth.accessToken !== null && auth} keyed>
		{(auth) => <AuthenticatedContext.Provider value={auth}>
			<ProfileGate>
				{props.children}
			</ProfileGate>
		</AuthenticatedContext.Provider>}
	</Show>;
}
