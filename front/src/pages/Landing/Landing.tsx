import { A, useNavigate } from "@solidjs/router";
import { onCleanup, onMount, Show } from "solid-js";
import { isLoggedIn } from "~/store/auth.store";
import Button from "~/components/ui/Button";
import FlexLogo from "~/components/common/logo/FlexLogo";

import "./Landing.scss";
import LinkParticles from "~/components/ui/LinkParticles";

export default function Landing() {
	const navigate = useNavigate();

	let observer!: IntersectionObserver;
	let easySectionRef!: HTMLElement;
	let freeSectionRef!: HTMLElement;
	let openSectionRef!: HTMLElement;

	const scrollToSection = (sectionId: string) => {
		document.getElementById(sectionId)?.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
	};

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
			<LinkParticles/>
			<h1>Flex</h1>
			<p>Another way to listen to music</p>
			<div class="hero-cta">
				<A href="#learn-more" onClick={(event) => {
					event.preventDefault();
					scrollToSection("learn-more");
				}}>Learn more</A>
				<Button onClick={() => scrollToSection("get-started")}>Get started</Button>
			</div>
		</section>
		<div id="learn-more" class="section-container">
			<section class="appearing-section whats-flex" ref={easySectionRef}>
				<div class="title-section">
					<h2>What's Flex ?</h2>
					<p>Flex is a platform that allow you to listen to music you and your friends host</p>
				</div>
				<div class="content-section">
					<div class="content">
						<h3>Flex servers</h3>
						<p>Flex hosts the account related systeme, and the interface to connect to your provider(s)</p>
					</div>
					<div class="separator"/>
					<div class="content">
						<h3>Your provider</h3>
						<p>You can install your own <A href="/#get-started">provider</A> to host your own music on your server. You just need to connect it to your flex account and you can start listening anywhere.</p>
					</div>
					<div class="separator"/>
					<div class="content">
						<h3>Your friends</h3>
						<p>Share your providers with your friends and extend your music library. You can also chat, share, and listen music together.</p>
					</div>
				</div>
			</section>
			<div class="bottom-sections">
				<section id="get-started" class="appearing-section" ref={freeSectionRef}>
					<div style={{ display: "flex" }}>
						<div>
							<h2>Get started !</h2>
							<p></p>
						</div>
						<p></p>
					</div>
				</section>
				<section class="appearing-section" ref={openSectionRef}>
					<h2>Join the project!</h2>
				</section>
			</div>
		</div>
	</main>;
}
