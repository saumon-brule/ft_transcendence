import { useSearchParams } from "@solidjs/router";

export function useTabParam<T extends string>(tabs: readonly T[], fallback: T, key = "tab") {
	const [searchParams, setSearchParams] = useSearchParams();

	const tab = (): T => {
		const value = searchParams[key];
		return tabs.includes(value as T) ? value as T : fallback;
	};
	const setTab = (value: T) => setSearchParams({ [key]: value }, { replace: true });

	return [tab, setTab] as const;
}
