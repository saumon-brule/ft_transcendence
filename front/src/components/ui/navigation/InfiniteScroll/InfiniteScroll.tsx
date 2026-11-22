import { createEffect, onCleanup, onMount } from "solid-js";
import "./InfiniteScroll.scss";

type InfiniteScrollProps = {
	enabled: boolean;
	onLoadMore: () => void;
};

const PRELOAD_DISTANCE = "400px";

export default function InfiniteScroll(props: InfiniteScrollProps) {
	let sentinel!: HTMLDivElement;
	let observer: IntersectionObserver | undefined;

	onMount(() => {
		observer = new IntersectionObserver((entries) => {
			if (entries.some((entry) => entry.isIntersecting) && props.enabled) props.onLoadMore();
		}, { rootMargin: PRELOAD_DISTANCE });
		onCleanup(() => observer?.disconnect());
	});

	createEffect(() => {
		if (!observer) return;
		observer.unobserve(sentinel);
		if (props.enabled) observer.observe(sentinel);
	});

	return <div class="infinite-scroll-sentinel" ref={sentinel} aria-hidden="true" />;
}
