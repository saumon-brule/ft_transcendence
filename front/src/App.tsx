import { QueryClientProvider } from "@tanstack/solid-query";
import { queryClient } from "./api/queryClient";
import { Show, type Component } from "solid-js";
import { AppRouter } from "./routes";
import { I18nProvider } from "./i18n/context";
import { initialized } from "./store/auth.store";
import "./store/presence.store";
import LoadingSplash from "./pages/Loading/LoadingSplash";
import { ToasterAnchor } from "./components/ui/Toaster";
import { OverlayRoot } from "./components/ui/Overlay";

const App: Component = () => {
	return <QueryClientProvider client={queryClient}>
		<I18nProvider>
			<ToasterAnchor />
			<OverlayRoot>
				<Show when={initialized()} fallback={<LoadingSplash/>}>
					<AppRouter />
				</Show>
			</OverlayRoot>
		</I18nProvider>
	</QueryClientProvider>;
};

export default App;
