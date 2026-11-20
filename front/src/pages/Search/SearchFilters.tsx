import { Show } from "solid-js";
import Form from "~/components/inputs/Form/Form";
import TextInput from "~/components/inputs/TextInput";
import type { SearchFilters as Filters } from "~/api/queryHooks/providerInfo";
import { type SearchFilterField } from "./useSearchFilters";
import "./SearchFilters.scss";

type SearchFiltersProps = {
	fields: readonly SearchFilterField[];
	value: Filters;
	onChange: (filters: Filters) => void;
};

export default function SearchFilters(props: SearchFiltersProps) {
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
					<label for="search-filter-music">Music</label>
					<TextInput id="search-filter-music" name="music" type="text" placeholder="Exact title" value={props.value.music ?? ""} />
				</div>
			</Show>
			<Show when={shows("album")}>
				<div class="filter-field">
					<label for="search-filter-album">Album</label>
					<TextInput id="search-filter-album" name="album" type="text" placeholder="Exact title" value={props.value.album ?? ""} />
				</div>
			</Show>
			<Show when={shows("artist")}>
				<div class="filter-field">
					<label for="search-filter-artist">Artist</label>
					<TextInput id="search-filter-artist" name="artist" type="text" placeholder="Exact name" value={props.value.artist ?? ""} />
				</div>
			</Show>
			<Show when={shows("dateAfter")}>
				<div class="filter-field">
					<label for="search-filter-date-after">After</label>
					<div class="text-input">
						<input id="search-filter-date-after" name="dateAfter" type="date" value={props.value.dateAfter ?? ""} />
					</div>
				</div>
			</Show>
			<Show when={shows("dateBefore")}>
				<div class="filter-field">
					<label for="search-filter-date-before">Before</label>
					<div class="text-input">
						<input id="search-filter-date-before" name="dateBefore" type="date" value={props.value.dateBefore ?? ""} />
					</div>
				</div>
			</Show>
		</Form>
	</Show>;
}

