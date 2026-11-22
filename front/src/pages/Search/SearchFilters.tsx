import { Show } from "solid-js";
import Form from "~/components/inputs/Form/Form";
import TextInput from "~/components/inputs/TextInput";
import type { SearchFilters as Filters } from "~/api/queryHooks/providerInfo";
import { type SearchFilterField } from "./useSearchFilters";
import "./SearchFilters.scss";
import { useTranslation } from "~/i18n/context";

type SearchFiltersProps = {
	fields: readonly SearchFilterField[];
	value: Filters;
	onChange: (filters: Filters) => void;
};

export default function SearchFilters(props: SearchFiltersProps) {
	const { t } = useTranslation();
	const shows = (field: SearchFilterField) => props.fields.includes(field);

	function apply(form: HTMLFormElement) {
		const data = new FormData(form);
		const next: Filters = { ...props.value };
		for (const field of props.fields) {
			const value = data.get(field);
			next[field] = typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
		}
		props.onChange(next);
	}

	return <Show when={props.fields.length > 0}>
		<Form class="search-filters" onSubmit={(e) => apply(e.currentTarget)} onChange={(e) => apply(e.currentTarget)}>
			<Show when={shows("music")}>
				<div class="filter-field">
					<label for="search-filter-music">{t("pages.search.filters.music")}</label>
					<TextInput id="search-filter-music" name="music" type="text" size="sm" placeholder={t("pages.search.filters.exactTitle")} value={props.value.music ?? ""} />
				</div>
			</Show>
			<Show when={shows("album")}>
				<div class="filter-field">
					<label for="search-filter-album">{t("pages.search.filters.album")}</label>
					<TextInput id="search-filter-album" name="album" type="text" size="sm" placeholder={t("pages.search.filters.exactTitle")} value={props.value.album ?? ""} />
				</div>
			</Show>
			<Show when={shows("artist")}>
				<div class="filter-field">
					<label for="search-filter-artist">{t("pages.search.filters.artist")}</label>
					<TextInput id="search-filter-artist" name="artist" type="text" size="sm" placeholder={t("pages.search.filters.exactName")} value={props.value.artist ?? ""} />
				</div>
			</Show>
			<Show when={shows("dateAfter")}>
				<div class="filter-field">
					<label for="search-filter-date-after">{t("pages.search.filters.after")}</label>
					<TextInput id="search-filter-date-after" name="dateAfter" type="date" size="sm" value={props.value.dateAfter ?? ""} />
				</div>
			</Show>
			<Show when={shows("dateBefore")}>
				<div class="filter-field">
					<label for="search-filter-date-before">{t("pages.search.filters.before")}</label>
					<TextInput id="search-filter-date-before" name="dateBefore" type="date" size="sm" value={props.value.dateBefore ?? ""} />
				</div>
			</Show>
		</Form>
	</Show>;
}
