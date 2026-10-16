import { JSX, splitProps } from "solid-js";

import "./Toggle.scss";

type ToggleProps = Omit<JSX.IntrinsicElements["input"], "checked" | "type"> & {
	checked: boolean;
	label: string;
};

export default function Toggle(props: ToggleProps) {
	const [local, rest] = splitProps(props, ["checked", "label", "class"]);

	return <label class={`toggle ${local.class ?? ""}`}>
		<span>{local.label}</span>
		<input type="checkbox" checked={local.checked} {...rest} />
		<span class="toggle-track" aria-hidden="true">
			<span class="toggle-thumb" />
		</span>
	</label>;
}
