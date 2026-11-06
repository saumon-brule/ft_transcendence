import { createEffect, For, type JSX, on, onCleanup, onMount } from "solid-js";
import Button from "~/components/inputs/Button";
import "./Tabs.scss";

type TabsProps<T extends string> = {
	tabs: readonly T[];
	value: T;
	onChange: (tab: T) => void;
	label?: (tab: T) => JSX.Element;
	class?: string;
};

export default function Tabs<T extends string>(props: TabsProps<T>) {
	let nav!: HTMLElement;

	const updateIndicator = () => {
		const selected = nav.querySelector<HTMLElement>("[aria-selected=true]");
		nav.style.setProperty("--indicator-left", `${selected?.offsetLeft ?? 0}px`);
		nav.style.setProperty("--indicator-width", `${selected?.offsetWidth ?? 0}px`);
	};

	createEffect(on(() => props.value, updateIndicator));
	onMount(() => {
		const observer = new ResizeObserver(updateIndicator);
		observer.observe(nav);
		onCleanup(() => observer.disconnect());
	});

	return <nav class={`tabs ${props.class ?? ""}`} role="tablist" ref={nav}>
		<For each={props.tabs}>
			{(tab) => <Button
				type="button"
				role="tab"
				variant="text"
				aria-selected={props.value === tab}
				classList={{ active: props.value === tab }}
				onClick={() => props.onChange(tab)}
			>
				{props.label ? props.label(tab) : tab}
			</Button>}
		</For>
	</nav>;
}
