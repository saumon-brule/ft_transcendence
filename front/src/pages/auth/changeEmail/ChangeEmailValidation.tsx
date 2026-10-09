import { createSignal, Match, onMount, Switch } from "solid-js";
import { client } from "~/api/client";
import "./ChangeEmailValidation.scss";
import { A, useLocation } from "@solidjs/router";
import DialogPage from "~/components/ui/DialogPage";
import { useTranslation } from "~/i18n/context";
import LinkParticles from "~/components/ui/LinkParticles";

type State = "WAITING" | "CONFIRMED" | "MISSING_TOKEN" | "ERROR";

export default function ChangeEmailValidation() {
	const { t } = useTranslation();
	const location = useLocation();

	const changeEmailMutation = client.auth.resetEmail.createMutation();
	const [state, setState] = createSignal<State>("WAITING");


	onMount(() => {
		const token = new URLSearchParams(location.search).get("token");
		if (!token) {
			setState("MISSING_TOKEN");
			return;
		}
		changeEmailMutation.mutate(
			{ body: { token } },
			{
				onSuccess: () => setState("CONFIRMED"),
				onError: () => setState("ERROR"),
			},
		);
	});

	return <><LinkParticles/><DialogPage id="confirm-email">
		<h2>Confirme ton nouvel email</h2>
		<hr/>
		<div class="content">
			<Switch>
				<Match when={state() === "WAITING"}>
					<p>{t("pages.confirmEmail.loadingMessage")}</p>
				</Match>
				<Match when={state() === "CONFIRMED"}>
					<p>Ton nouvel email a été confirmé.</p>
					<A href="/home">{t("pages.confirmEmail.successLink")}</A>
				</Match>
				<Match when={state() === "MISSING_TOKEN"}>
					<p>{t("pages.confirmEmail.errorMessage")}</p>
					<A href="/home">{t("pages.confirmEmail.errorLink")}</A>
				</Match>
				<Match when={state() === "ERROR"}>
					<p>{t("pages.confirmEmail.errorMessage")}</p>
					<A href="/home">{t("pages.confirmEmail.errorLink")}</A>
				</Match>
			</Switch>
		</div>
	</DialogPage></>;
}
