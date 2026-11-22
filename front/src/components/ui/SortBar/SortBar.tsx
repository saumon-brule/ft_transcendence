import { For, Show } from "solid-js";
import { ArrowDown, ArrowUp } from "lucide-solid";
import type { SearchSortField } from "@flex/shared";
import type { SearchSort as Sort } from "~/api/queryHooks/providerInfo";
import Button from "~/components/inputs/Button";
import { nextSort, sortFieldLabel } from "./useSortParam";
import { useTranslation } from "~/i18n/context";
import "./SortBar.scss";

type SortBarProps<F extends SearchSortField | "provider"> = {
	fields: readonly F[];
	value: Sort<F> | undefined;
	onChange: (sort: Sort<F> | undefined) => void;
};

export default function SortBar<F extends SearchSortField | "provider">(props: SortBarProps<F>) {
	const { t } = useTranslation();
	const ariaSort = (field: F) => props.value?.field === field
		? props.value.order === "asc"
			? "ascending"
			: "descending"
		: "none";

	return <Show when={props.fields.length > 0}>
		<div class="search-sort" role="group" aria-label={t("components.sortBar.label")}>
			<span class="search-sort-label">{t("components.sortBar.sortBy")}</span>
			<For each={props.fields}>
				{(field) => <Button
					type="button"
					variant="text"
					class="search-sort-field"
					classList={{ active: props.value?.field === field }}
					aria-sort={ariaSort(field)}
					onClick={() => props.onChange(nextSort(props.value, field))}
				>
					{sortFieldLabel(field)}
					<span class="sort-arrow" aria-hidden="true">
						<Show when={props.value?.field === field}>
							{props.value?.order === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
						</Show>
					</span>
				</Button>}
			</For>
		</div>
	</Show>;
}
