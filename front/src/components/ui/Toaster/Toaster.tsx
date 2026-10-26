import { createRoot, createSignal, For, JSXElement } from "solid-js";
import { TransitionGroup } from "solid-transition-group";
import "./Toaster.scss";

const DEFAULT_TTL = 3000;

export interface ToastControls {
	remove: () => void;
}

export type ToastContent = JSXElement | ((controls: ToastControls) => JSXElement);

export interface SummonToastOptions {
	customClass?: string;
	/** The time the Toast stay in ms. */
	ttl?: number;
	ref?: (element: HTMLDialogElement) => void;
}

export interface Toast {
	id: number;
	element: ToastContent;
	controls: ToastControls;
}

const { toasts, setToasts } = createRoot(() => {
	const [toasts, setToasts] = createSignal<Toast[]>([]);
	return { toasts, setToasts };
});

let toastId = 0;

export function summonRawToast(content: ToastContent, options?: SummonToastOptions): ToastControls {
	const ttl = options?.ttl ?? DEFAULT_TTL;
	const thisToastId = toastId++;

	function removeToast() {
		setToasts((prev) => prev.filter((toast) => toast.id !== thisToastId));
	}

	const deleteTimeoutId = setTimeout(removeToast, ttl);

	const newToast = {
		id: thisToastId,
		element: content,
		controls: {
			remove: () => {
				clearTimeout(deleteTimeoutId);
				removeToast();
			},
		},
	};

	setToasts((prev) => [...prev, newToast]);

	return newToast.controls;
}

export function getRenderedToastContent(content: ToastContent, controls: ToastControls): JSXElement {
	return typeof content === "function" ? content(controls) : content;
}

export function ToasterAnchor() {
	return <div id="toast-container" class="">
		<TransitionGroup name="toast-wrapper" onExit={(_, done) => setTimeout(done, 1000)}>
			<For each={toasts()}>{(toast) => <div onClick={toast.controls.remove}>
				{getRenderedToastContent(toast.element, toast.controls)}
			</div>}</For>
		</TransitionGroup>
	</div>;
}
