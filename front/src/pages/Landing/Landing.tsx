import { A, useNavigate } from "@solidjs/router";
import { onCleanup, onMount, Show } from "solid-js";
import { isLoggedIn } from "~/store/auth.store";
import Button from "~/components/inputs/Button";
import FlexLogo from "~/components/common/logo/FlexLogo";

import "./Landing.scss";
import LinkParticles from "~/components/ui/page/LinkParticles";
import LanguageSelect from "~/components/common/LanguageSelect/LanguageSelect";
import { useTranslation } from "~/i18n/context";

export default function Landing() {
	const { t } = useTranslation();
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
			<div class="auth-buttons"><LanguageSelect /><Show when={isLoggedIn()} fallback={<>
				<Button onClick={() => navigate("/login")}>{t("pages.landing.login")}</Button>
				<Button onClick={() => navigate("/register")} variant="text">{t("pages.landing.signUp")}</Button>
			</>}>
				<Button onClick={() => navigate("/home")}>{t("pages.landing.listen")}</Button>
			</Show>
			</div>
		</header>
		<section class="hero-banner">
			<LinkParticles/>
			<h1>Flex</h1>
			<p>{t("pages.landing.hero.subtitle")}</p>
			<div class="hero-cta">
				<A href="#learn-more" onClick={(event) => {
					event.preventDefault();
					scrollToSection("learn-more");
				}}>{t("pages.landing.hero.learnMore")}</A>
				<Button onClick={() => scrollToSection("get-started")}>{t("pages.landing.hero.getStarted")}</Button>
			</div>
		</section>
		<div id="learn-more" class="section-container">
			<section class="appearing-section whats-flex" ref={easySectionRef}>
				<div class="title-section">
					<h2>{t("pages.landing.whatsFlex.title")}</h2>
					<p>{t("pages.landing.whatsFlex.description")}</p>
				</div>
				<div class="content-section">
					<div class="content">
						<h3>{t("pages.landing.whatsFlex.servers.title")}</h3>
						<p>{t("pages.landing.whatsFlex.servers.description")}</p>
					</div>
					<div class="separator"/>
					<div class="content">
						<h3>{t("pages.landing.whatsFlex.provider.title")}</h3>
						<p>{t("pages.landing.whatsFlex.provider.description.begin")}<A href="/#get-started">{t("pages.landing.whatsFlex.provider.description.link")}</A>{t("pages.landing.whatsFlex.provider.description.end")}</p>
					</div>
					<div class="separator"/>
					<div class="content">
						<h3>{t("pages.landing.whatsFlex.friends.title")}</h3>
						<p>{t("pages.landing.whatsFlex.friends.description")}</p>
					</div>
				</div>
			</section>
			<div class="bottom-sections">
				<section id="get-started" class="appearing-section get-started" ref={freeSectionRef}>
					<div class="title-section">
						<h2>{t("pages.landing.getStarted.title")}</h2>
						<p>{t("pages.landing.getStarted.description")}</p>
					</div>
					<div class="content-section">
						<div class="content">
							<h3>{t("pages.landing.getStarted.account.title")}</h3>
							<p>{t("pages.landing.getStarted.account.description")}</p>
						</div>
						<div class="separator"/>
						<div class="content">
							<h3>{t("pages.landing.getStarted.setup.title")}</h3>
							<p>{t("pages.landing.getStarted.setup.install")}</p>
							<code>
								git clone git@github.com:saumon-brule/ft_transcendence.git flex<br/>
								cd flex<br/>
							</code>
							<p>{t("pages.landing.getStarted.setup.config")}</p>
							<code>docker compose up -d</code>
							<p>{t("pages.landing.getStarted.setup.fill")}</p>
						</div>
						<div class="separator"/>
						<div class="content">
							<h3>{t("pages.landing.getStarted.share.title")}</h3>
							<p>{t("pages.landing.getStarted.share.description")}</p>
						</div>
					</div>
				</section>
				<section class="appearing-section contribute" ref={openSectionRef}>
					<h2>{t("pages.landing.contribute.title")}</h2>
					<p class="mobile-center">{t("pages.landing.contribute.description")}<A class="github-link" href="https://github.com/saumon-brule/ft_transcendence">GitHub</A></p>
					<div class="legal-links">
						<A href="/privacy-policy">{t("components.sidebar.privacyPolicy")}</A>
						<A href="/terms-of-service">{t("components.sidebar.termsOfService")}</A>
					</div>
				</section>
			</div>
		</div>
	</main>;
}
