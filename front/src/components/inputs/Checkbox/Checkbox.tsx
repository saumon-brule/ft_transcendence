import { JSX, Show, splitProps } from "solid-js";

import "./Checkbox.scss";

type CheckboxProps = Omit<JSX.IntrinsicElements["input"], "checked" | "type"> & {
	checked: boolean;
	label?: string;
};

export default function Checkbox(props: CheckboxProps) {
	const [local, rest] = splitProps(props, ["checked", "label", "class"]);

	return <label class={`checkbox ${local.class ?? ""}`}>
		<input type="checkbox" checked={local.checked} {...rest} />
		<span class="checkbox-box" aria-hidden="true">
			<svg class="checkbox-check" viewBox="0 0 16 16">
				<path d="M3.5 8.5l3 3 6-7" />
			</svg>
		</span>
		<Show when={local.label}>
			<span>{local.label}</span>
		</Show>
	</label>;
}
