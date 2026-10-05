import { useNavigate } from "@solidjs/router";
import { onCleanup, onMount, Show } from "solid-js";
import { isLoggedIn } from "~/store/auth.store";
import Button from "~/components/ui/Button";
import FlexLogo from "~/components/common/logo/FlexLogo";

import "./Landing.scss";

export default function Landing() {
	const navigate = useNavigate();

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
		<header>
			<div class="logo">
				<FlexLogo/>
			</div>
			<div class="auth-buttons"><Show when={isLoggedIn()} fallback={<>
				<Button onClick={() => navigate("/login")}>Login</Button>
				<Button onClick={() => navigate("/register")} variant="text">Sign up</Button>
			</>}>
				<Button onClick={() => navigate("/home")}>Listen</Button>
			</Show>
			</div>
		</header>
		<section class="hero-banner">
			<h1>Flex</h1>
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
