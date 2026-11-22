import { A } from "@solidjs/router";

import "./RegisterForm.scss";
import Button from "~/components/inputs/Button";
import TextInput from "~/components/inputs/TextInput";
import { createSignal, JSXElement, Show } from "solid-js";
import { client } from "~/api/client";
import { registerSchema } from "@flex/shared";
import { authActions } from "~/store/auth.store";
import Form from "~/components/inputs/Form/Form";
import { validateFromZod } from "~/utils/validateFromZod";
import { useTranslation } from "~/i18n/context";
import IntraButton from "~/components/common/IntraButton/IntraButton";
import Logo42 from "~/components/graphics/icons/Logo42";

export default function RegisterForm() {
	const [error, setError] = createSignal<JSXElement>(null);
	const { t } = useTranslation();

	const registerMutation = client.auth.register.createMutation();

	let usernameInput!: HTMLInputElement;
	let emailInput!: HTMLInputElement;
	let passwordInput!: HTMLInputElement;

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		registerMutation.mutate(
			{
				body: {
					username: usernameInput.value,
					email: emailInput.value,
					password: passwordInput.value,
				},
			},
			{
				onSuccess: (data) => {
					authActions.login(data.body.accessToken);
				},
				onError: (e) => {
					if (e.status === 409) {
						setError(t("errors.register.conflictingEmail"));
					} else {
						setError(t("errors.unknownFallback"));
					}
				},
			},
		);
	}

	return <Form onSubmit={handleSubmit} id="register-form">
		<div class="register-inputs">
			<TextInput ref={(e) => emailInput = e.htmlElement} type="email" validator={(e) => validateFromZod(registerSchema.shape.email, e.value)} placeholder={t("pages.auth.email")} required />
			<TextInput ref={(e) => usernameInput = e.htmlElement} type="text" validator={(e) => validateFromZod(registerSchema.shape.username, e.value)} placeholder={t("pages.auth.username")} required />
			<TextInput ref={(e) => passwordInput = e.htmlElement} type="password" validator={(e) => validateFromZod(registerSchema.shape.password, e.value)} placeholder={t("pages.auth.password")} required />
			<TextInput type="password" validator={(e) => e.value !== passwordInput.value && t("errors.input.text.password.confirmationMismatch")} placeholder={t("pages.auth.confirmPassword")} />
			<Show when={error()}>
				<p class="invalid-message" role="alert">
					{error()}
				</p>
			</Show>
		</div>
		<Button type="submit">
			{t("pages.register.submit")}
		</Button>
		<div class="separator">
			<hr />
			{t("pages.auth.or")}
			<hr />
		</div>
		<IntraButton linkType="auth">
			{t("pages.register.intra.begin")}<Logo42/>{t("pages.register.intra.end")}
		</IntraButton>
		<p class="register-details">
			{t("pages.register.switch.begin")}<A href="/login">{t("pages.register.switch.link")}</A>{t("pages.register.switch.end")}
		</p>
	</Form>;
}
