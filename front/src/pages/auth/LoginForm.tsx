import { A } from "@solidjs/router";
import Button from "~/components/inputs/Button";
import TextInput from "~/components/inputs/TextInput";
import { client } from "~/api/client";
import { createSignal, JSXElement, Show } from "solid-js";
import { authActions } from "~/store/auth.store";
import { loginSchema } from "@flex/shared";
import { useTranslation } from "~/i18n/context";
import "./LoginForm.scss";
import Form from "~/components/inputs/Form/Form";
import { validateFromZod } from "~/utils/validateFromZod";
import IntraButton from "~/components/common/IntraButton/IntraButton";
import Logo42 from "~/components/graphics/icons/Logo42";

export default function LoginForm() {
	const [error, setError] = createSignal<JSXElement>(null);

	const { t } = useTranslation();

	const loginMutation = client.auth.login.createMutation();

	let usernameInput!: HTMLInputElement;
	let passwordInput!: HTMLInputElement;

	const handleSubmit = (e: SubmitEvent) => {
		e.preventDefault();

		loginMutation.mutate(
			{ body: { email: usernameInput.value, password: passwordInput.value } },
			{
				onSuccess: (data) => {
					authActions.login(data.body.accessToken);
				},
				onError: (e) => {
					if (e.status === 401) {
						switch (e.body.code) {
							case "INTRA_ONLY_ACCOUNT":
								setError(
									<>
										{t("pages.login.error.intraOnly.begin")}
										<a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">
											{t("pages.login.error.intraOnly.link")}
										</a>
										{t("pages.login.error.intraOnly.end")}
									</>,
								);
								break;
							case "INVALID_CREDENTIALS":
								setError(t("pages.login.error.invalidCredentials"));
								break;
							default:
								setError(e.body.message);
						}
					} else {
						setError(t("errors.unknownFallback"));
					}
				},
			},
		);
	};

	return <Form onSubmit={handleSubmit} id="login-form">
		<div class="login-inputs">
			<TextInput ref={(e) => usernameInput = e.htmlElement} type="email" validator={(e) => validateFromZod(loginSchema.shape.email, e.value)} placeholder={t("pages.auth.email")} required />
			<TextInput ref={(e) => passwordInput = e.htmlElement} type="password" validator={(e) => validateFromZod(loginSchema.shape.password, e.value)} placeholder={t("pages.auth.password")} required />
			<p class="password-reset">
				<A href="/auth/request-password-reset">{t("pages.login.forgotPassword")}</A>
			</p>
			<Show when={error()}>
				<p class="invalid-message" role="alert">
					{error()}
				</p>
			</Show>
		</div>
		<Button type="submit">{t("pages.login.submit")}</Button>
		<div class="separator">
			<hr />
			{t("pages.auth.or")}
			<hr />
		</div>
		<IntraButton linkType="auth">{t("pages.login.intra.begin")}<Logo42/>{t("pages.login.intra.end")}</IntraButton>
		<p class="auth-switcher">
			{t("pages.login.switch.begin")}<A href="/register">{t("pages.login.switch.link")}</A>{t("pages.login.switch.end")}
		</p>
	</Form>;
}
