import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { Show, type Component } from "solid-js";
import { AppRouter } from "./routes";
import { I18nProvider } from "./i18n/context";
import { initialized } from "./store/auth.store";
import LoadingSplash from "./pages/Loading/LoadingSplash";
import { ToasterProvider } from "./components/ui/Toaster";
import { OverlayProvider } from "./components/ui/Overlay";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: false,
		},
	},
});

const App: Component = () => {
	return <QueryClientProvider client={queryClient}>
		<I18nProvider>
			<ToasterProvider>
				<OverlayProvider>
					<Show when={initialized()} fallback={<LoadingSplash/>}>
						<AppRouter />
					</Show>
				</OverlayProvider>
			</ToasterProvider>
		</I18nProvider>
	</QueryClientProvider>;
};

export default App;
