import { Navigate, Route, RouteProps } from "@solidjs/router";
import Settings from "./Settings";
import AccountSettings from "./pages/AccountSettings";

export default function SettingsRoutes<S extends string, T = unknown>(props: Omit<RouteProps<S, T>, "path" | "component">) {
	return <Route path="/settings" component={Settings} {...props} >
		<Route path="/" component={() => <Navigate href={"/settings/account"}/>} />
		<Route path="/account" component={AccountSettings} />
	</Route>;
}
