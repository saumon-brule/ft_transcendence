import { createMemo } from "solid-js";
import { useSearchParams } from "@solidjs/router";
import type { SearchSortField } from "@flex/shared";
import type { SearchSort } from "~/api/queryHooks/providerInfo";
import { t } from "~/i18n/context";

export function sortFieldLabel(field: SearchSortField | "provider"): string {
	return t(`components.sortBar.fields.${field}`);
}

export function nextSort<F extends SearchSortField | "provider">(current: SearchSort<F> | undefined, field: F): SearchSort<F> | undefined {
	if (current?.field !== field) return { field, order: "asc" };
	return current.order === "asc"
		? { field, order: "desc" }
		: undefined;
}

export function useSortParam<F extends SearchSortField | "provider">(fields: () => readonly F[]) {
	const [params, setParams] = useSearchParams();

	const sort = createMemo<SearchSort<F> | undefined>(() => {
		const field = fields().find((candidate) => candidate === params.sort);
		if (!field) return undefined;
		return { field, order: params.order === "desc" ? "desc" : "asc" };
	});

	const setSort = (next: SearchSort<F> | undefined) => {
		setParams({ sort: next?.field, order: next?.order }, { replace: true });
	};

	return [sort, setSort] as const;
}
