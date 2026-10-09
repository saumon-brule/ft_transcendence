import { ParentComponent, JSXElement, createRoot, createSignal, For, createEffect, createMemo, onCleanup } from "solid-js";
import "./OverlaysProvider.scss";
import { TransitionGroup } from "solid-transition-group";

export type SummonPopUp = () => void;

export interface SummonOverlayOptions {
	customClass?: string;
	ref?: (element: HTMLDialogElement) => void;
	onClose?: () => void;
}

export interface Overlay {
	id: number;
	element: JSXElement;
	options: SummonOverlayOptions;
	remove: () => void;
}

const { overlays, setOverlays } = createRoot(() => {
	const [overlays, setOverlays] = createSignal<Overlay[]>([]);
	return { overlays, setOverlays };
});

let overlayId = 0;

export function summonOverlay(content: JSXElement, options: SummonOverlayOptions = {}): Overlay {
	const thisOverlayId = overlayId++;

	function removeOverlay() {
		if (options?.onClose) options.onClose();
		setOverlays((prev) => prev.filter((overlay) => overlay.id !== thisOverlayId));
	}

	const newOverlay: Overlay = {
		id: thisOverlayId,
		element: content,
		options,
		remove: removeOverlay,
	};

	setOverlays((prev) => [...prev, newOverlay]);

	return newOverlay;
}

export function summonPopUp(content: JSXElement, options: SummonOverlayOptions = {}): Overlay {
	return summonOverlay(content, {
		...options,
		customClass: options.customClass ? options.customClass + " pop-up" : "pop-up",
	});
}

export const OverlayProvider: ParentComponent = (props) => {
	const hasOverlays = createMemo(() => overlays().length > 0);

	createEffect(() => {
		if (!hasOverlays()) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				const currentOverlays = overlays();
				currentOverlays[currentOverlays.length - 1].remove();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		onCleanup(() => document.removeEventListener("keydown", handleKeyDown));
	});

	return <>
		<div id="overlay-container" class={hasOverlays() ? " visible" : ""} onClick={(e) => {
			if (e.target !== e.currentTarget) return;
			const currentOverlays = overlays();
			currentOverlays[currentOverlays.length - 1].remove();
		}} >
			<TransitionGroup name="overlay-wrapper" onExit={(_, done) => setTimeout(done, 200)}>
				<For each={overlays()}>
					{(overlay) => <div class={`overlay ${overlay.options.customClass ?? ""}`}>
						{overlay.element}
					</div>}
				</For>
			</TransitionGroup>
		</div>
		{props.children}
	</>;
};
