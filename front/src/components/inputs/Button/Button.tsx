import { JSX, splitProps } from "solid-js";
import "./Button.scss";

export type ButtonProps = JSX.IntrinsicElements["button"] & {
	variant?: "primary" | "ghost" | "danger" | "text" | "link";
	size?: "sm" | "md" | "lg";
	icon?: boolean;
};

export default function Button(props: ButtonProps) {
	const [local, rest] = splitProps(props, ["variant", "size", "icon", "class", "children"]);

	return <button class={`btn btn--${local.variant ?? "primary"} btn--${local.size ?? "md"} ${local.icon ? "btn--icon" : ""} ${local.class ?? ""}`} {...rest}>
		{local.children}
	</button>;
}
