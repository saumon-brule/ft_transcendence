import { ParentComponent, JSXElement, createRoot, createSignal, For, createEffect, createMemo, onCleanup } from "solid-js";
import { TransitionGroup } from "solid-transition-group";
import "./Overlays.scss";

export interface OverlayControls {
	close: () => void;
}

export type OverlayContent = JSXElement | ((controls: OverlayControls) => JSXElement);

export interface SummonOverlayOptions {
	customClass?: string;
	ref?: (element: HTMLDialogElement) => void;
	onClose?: () => void;
}

export interface Overlay {
	id: number;
	element: OverlayContent;
	options: SummonOverlayOptions;
	controls: OverlayControls;
}

const { overlays, setOverlays } = createRoot(() => {
	const [overlays, setOverlays] = createSignal<Overlay[]>([]);
	return { overlays, setOverlays };
});

let overlayId = 0;

export function summonOverlay(content: OverlayContent, options: SummonOverlayOptions = {}): OverlayControls {
	const thisOverlayId = overlayId++;

	function closeOverlay() {
		if (!overlays().some((overlay) => overlay.id === thisOverlayId)) return;
		setOverlays((prev) => prev.filter((overlay) => overlay.id !== thisOverlayId));
		options.onClose?.();
	}

	const newOverlay: Overlay = {
		id: thisOverlayId,
		element: content,
		options,
		controls: {
			close: closeOverlay,
		},
	};

	setOverlays((prev) => [...prev, newOverlay]);

	return newOverlay.controls;
}

export function summonPopUp(content: OverlayContent, options: SummonOverlayOptions = {}): OverlayControls {
	return summonOverlay(content, {
		...options,
		customClass: options.customClass ? options.customClass + " pop-up" : "pop-up",
	});
}

export function getRenderedOverlayContent(content: OverlayContent, controls: OverlayControls): JSXElement {
	return typeof content === "function" ? content(controls) : content;
}

export const OverlayRoot: ParentComponent = (props) => {
	const hasOverlays = createMemo(() => overlays().length > 0);

	createEffect(() => {
		if (!hasOverlays()) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				const currentOverlays = overlays();
				currentOverlays[currentOverlays.length - 1].controls.close();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		onCleanup(() => document.removeEventListener("keydown", handleKeyDown));
	});

	return <>
		<div id="overlay-container" class={hasOverlays() ? " visible" : ""} onClick={(e) => {
			if (e.target !== e.currentTarget) return;
			const currentOverlays = overlays();
			currentOverlays[currentOverlays.length - 1].controls.close();
		}} >
			<TransitionGroup name="overlay-wrapper" onExit={(_, done) => setTimeout(done, 200)}>
				<For each={overlays()}>
					{(overlay) => <div class={`overlay ${overlay.options.customClass ?? ""}`}>
						{getRenderedOverlayContent(overlay.element, overlay.controls)}
					</div>}
				</For>
			</TransitionGroup>
		</div>
		<div style={{ display: "contents" }} inert={hasOverlays()}>
			{props.children}
		</div>
	</>;
};
