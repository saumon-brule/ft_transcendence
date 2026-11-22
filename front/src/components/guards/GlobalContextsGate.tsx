import { Show } from "solid-js";
import { RouteSectionProps } from "@solidjs/router";
import { QueryClientProvider } from "@tanstack/solid-query";
import { queryClient } from "~/api/queryClient";
import { I18nProvider } from "~/i18n/context";
import { ToasterAnchor } from "~/components/ui/feedback/Toaster";
import { OverlayRoot } from "~/components/ui/overlays/Overlay";
import { initialized } from "~/store/auth.store";
import LoadingSplash from "~/pages/Loading/LoadingSplash";

export default function GlobalContextsGate(props: RouteSectionProps) {
	return <QueryClientProvider client={queryClient}>
		<I18nProvider>
			<ToasterAnchor />
			<OverlayRoot>
				<Show when={initialized()} fallback={<LoadingSplash />}>
					{props.children}
				</Show>
			</OverlayRoot>
		</I18nProvider>
	</QueryClientProvider>;
}
