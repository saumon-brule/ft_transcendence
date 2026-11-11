import { createEffect, createSignal, on, onCleanup, Show, untrack } from "solid-js";
import { Search, X } from "lucide-solid";
import Form from "~/components/inputs/Form/Form";
import TextInput from "~/components/inputs/TextInput";
import type { FormEmbeddedComponentRef } from "~/types/ComponentRef";

export default function ProviderSearchBar(props: { value: string; onSearch: (value: string) => void }) {
	const [value, setValue] = createSignal(untrack(() => props.value));
	let input!: FormEmbeddedComponentRef<HTMLInputElement>;
	let timeout: ReturnType<typeof setTimeout> | undefined;

	createEffect(on(() => props.value, (v) => setValue(v), { defer: true }));
	onCleanup(() => clearTimeout(timeout));

	function search(v: string, delay = 300) {
		setValue(v);
		clearTimeout(timeout);
		timeout = setTimeout(() => props.onSearch(v.trim()), delay);
	}

	return <Form class="provider-search" role="search" onSubmit={() => search(value(), 0)}>
		<Search class="search-icon" size={18}/>
		<TextInput type="search" placeholder="Search" value={value()} onInput={(event) => search(event.currentTarget.value)} ref={input}/>
		<Show when={value()}>
			<button class="search-clear" type="button" onClick={() => { search("", 0); input.htmlElement.focus(); }}>
				<X size={18}/>
			</button>
		</Show>
	</Form>;
}
