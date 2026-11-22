import { QueryClient } from "@tanstack/solid-query";
import { devWarn } from "~/utils/devLog";

const LOGGER_DEPRECATION = "Passing a custom logger has been deprecated";

export const queryClient = new QueryClient({
	// Failed queries/mutations are already handled by their callers (toasts, fallbacks):
	// only surface them as dev warnings instead of console errors.
	logger: {
		log: devWarn,
		warn: devWarn,
		error: (...args: unknown[]) => {
			if (typeof args[0] === "string" && args[0].startsWith(LOGGER_DEPRECATION)) return;
			devWarn(...args);
		},
	},
	defaultOptions: {
		queries: {
			retry: false,
		},
	},
});
