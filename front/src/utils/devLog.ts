export function devWarn(...args: unknown[]) {
	if (import.meta.env.DEV) console.warn(...args);
}
