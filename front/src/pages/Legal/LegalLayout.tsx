import { A } from "@solidjs/router";
import { JSX } from "solid-js";
import FlexLogo from "~/components/common/logo/FlexLogo";
import { legalInfo } from "./legalInfo";

import "./Legal.scss";

type LegalLayoutProps = {
	title: string;
	children: JSX.Element;
};

export default function LegalLayout(props: LegalLayoutProps) {
	return <div id="legal-page">
		<header>
			<A href="/" class="logo" aria-label="Back to Flex">
				<FlexLogo />
			</A>
		</header>
		<main>
			<article>
				<h1>{props.title}</h1>
				<p class="last-updated">Last updated: {legalInfo.lastUpdated}</p>
				{props.children}
			</article>
		</main>
		<footer>
			<A href="/privacy-policy">Privacy Policy</A>
			<span class="dot" />
			<A href="/terms-of-service">Terms of Service</A>
		</footer>
	</div>;
}
