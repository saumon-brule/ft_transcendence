import { createEffect, createSignal, JSX, onCleanup, Show, untrack } from "solid-js";
import "./Menu.scss";

export type MenuProps = {
	trigger: JSX.Element;
	children: (close: () => void) => JSX.Element;
	align?: "left" | "right";
	class?: string;
};

export function Menu(props: MenuProps) {
	const [open, setOpen] = createSignal(false);
	const [up, setUp] = createSignal(false);
	const [side, setSide] = createSignal<"left" | "right">(untrack(() => props.align ?? "right"));
	let ref!: HTMLDivElement;
	let menuRef!: HTMLDivElement;
	const close = () => setOpen(false);

	createEffect(() => {
		if (!open()) return;

		const MARGIN = 8;
		const place = () => {
			const trigger = ref.getBoundingClientRect();

			const spaceBelow = window.innerHeight - trigger.bottom;
			const spaceAbove = trigger.top;
			setUp(spaceBelow < menuRef.offsetHeight + MARGIN && spaceAbove > spaceBelow);

			const spaceLeftAlign = window.innerWidth - trigger.left;
			const spaceRightAlign = trigger.right;
			const needed = menuRef.offsetWidth + MARGIN;
			const fits = { left: spaceLeftAlign >= needed, right: spaceRightAlign >= needed };
			const preferred = props.align ?? "right";
			const other = preferred === "left" ? "right" : "left";
			if (fits[preferred]) setSide(preferred);
			else if (fits[other]) setSide(other);
			else setSide(spaceLeftAlign >= spaceRightAlign ? "left" : "right");
		};
		place();

		const observer = new ResizeObserver(place);
		observer.observe(menuRef);
		window.addEventListener("resize", place);
		onCleanup(() => {
			observer.disconnect();
			window.removeEventListener("resize", place);
			setUp(false);
			setSide(props.align ?? "right");
		});
	});

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
			<div ref={menuRef} class={`menu ${side()} ${up() ? "up" : ""} ${props.class ?? ""}`} role="menu">
				<div class="menu-content">{props.children(close)}</div>
			</div>
		</Show>
	</div>;
}
