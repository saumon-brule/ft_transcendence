import { RouteSectionProps } from "@solidjs/router";
import { Transition } from "solid-transition-group";

import "./AuthLayout.scss";

export default function AuthLayout(props: RouteSectionProps) {
	return <div id="auth-page">
		<div class="auth-hero" style={{ background: "pink" }} />
		<section class="auth-section">
			<div class="auth-block">
				<h1>Flex</h1>
				<Transition name="slide" mode="outin">
					<main class="form-container">
						{props.children}
					</main>
				</Transition>
			</div>
		</section>
	</div>;
}
