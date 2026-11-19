import { createEffect, createSignal, JSX, onCleanup, Show } from "solid-js";
import "./Menu.scss";

export type MenuProps = {
	trigger: JSX.Element;
	children: (close: () => void) => JSX.Element;
	align?: "left" | "right";
	class?: string;
};

export function Menu(props: MenuProps) {
	const [open, setOpen] = createSignal(false);
	let ref!: HTMLDivElement;
	const close = () => setOpen(false);

	createEffect(() => {
		if (!open()) return;

		const onPointerDown = (e: PointerEvent) => {
			if (!ref.contains(e.target as Node)) close();
		};
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") close();
		};
		document.addEventListener("pointerdown", onPointerDown);
		document.addEventListener("keydown", onKeyDown);
		onCleanup(() => {
			document.removeEventListener("pointerdown", onPointerDown);
			document.removeEventListener("keydown", onKeyDown);
		});
	});

	return <div class="menu-wrapper" ref={ref}>
		<div class="menu-trigger" onClick={() => setOpen((o) => !o)}>{props.trigger}</div>
		<Show when={open()}>
			<div class={`menu ${props.align ?? "right"} ${props.class ?? ""}`} role="menu">
				<div class="menu-content">{props.children(close)}</div>
			</div>
		</Show>
	</div>;
}
