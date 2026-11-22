import { A } from "@solidjs/router";
import { JSX } from "solid-js";
import FlexLogo from "~/components/common/logo/FlexLogo";
import { legalInfo } from "./legalInfo";
import LanguageSelect from "~/components/common/LanguageSelect/LanguageSelect";
import { useTranslation } from "~/i18n/context";

import "./Legal.scss";

type LegalLayoutProps = {
	title: string;
	children: JSX.Element;
};

export default function LegalLayout(props: LegalLayoutProps) {
	const { t, locale } = useTranslation();

	return <div id="legal-page">
		<header>
			<A href="/" class="logo" aria-label={t("pages.legal.backToFlex")}>
				<FlexLogo />
			</A>
			<LanguageSelect class="legal-language-select" />
		</header>
		<main>
			<article>
				<h1>{props.title}</h1>
				<p class="last-updated">{t("pages.legal.lastUpdated", { date: legalInfo.lastUpdated.toLocaleDateString(locale(), { dateStyle: "long" }) })}</p>
				{props.children}
			</article>
		</main>
		<footer>
			<A href="/privacy-policy">{t("components.sidebar.privacyPolicy")}</A>
			<span class="dot" />
			<A href="/terms-of-service">{t("components.sidebar.termsOfService")}</A>
		</footer>
	</div>;
}
