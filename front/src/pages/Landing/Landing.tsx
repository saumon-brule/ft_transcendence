import { A } from "@solidjs/router";
import { onCleanup, onMount } from "solid-js";

import "./Landing.scss";

export default function Landing() {
	let observer!: IntersectionObserver;
	let easySectionRef!: HTMLElement;
	let freeSectionRef!: HTMLElement;
	let openSectionRef!: HTMLElement;

	onMount(() => {
		observer = new IntersectionObserver((intersections) => {
			for (const intersection of intersections) {
				if (intersection.isIntersecting) {
					intersection.target.classList.add("visible");
				}
			}
		}, {
			rootMargin: "0px 0px -20% 0px",
			threshold: 0.1,
		});

		observer.observe(easySectionRef);
		observer.observe(freeSectionRef);
		observer.observe(openSectionRef);
	});

	onCleanup(() => {
		if (easySectionRef) observer.unobserve(easySectionRef);
		if (freeSectionRef) observer.unobserve(freeSectionRef);
		if (openSectionRef) observer.unobserve(openSectionRef);
	});

	return <main id="landing-page">
		<header><A href="/home">Listen</A></header>
		<section class="hero-banner">
			<h1>FLEX</h1>
		</section>
		<div class="section-container">
			<section class="appearing-section" ref={easySectionRef}>
				<h2>Easy</h2>
			</section>
			<section class="appearing-section" ref={freeSectionRef}>
				<h2>Free</h2>
			</section>
			<section class="appearing-section" ref={openSectionRef}>
				<h2>Open</h2>
			</section>
		</div>
	</main>;
}
