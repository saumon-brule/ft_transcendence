import { changePasswordSchema } from "@flex/shared";
import { createSignal } from "solid-js";
import { onMount } from "solid-js";
import { Show } from "solid-js";
import { client } from "~/api/client";
import Button from "~/components/ui/Button";
import Form from "~/components/ui/Form/Form";
import { summonPopUp } from "~/components/ui/Overlay";
import TextInput from "~/components/ui/TextInput";
import { summonErrorToast, summonSuccessToast } from "~/components/ui/Toaster";
import { useTranslation } from "~/i18n/context";
import { TranslatorLeafKeys } from "~/types/generics/TranslatorLeafKeys";
import { validateFromZod } from "~/utils/validateFromZod";

interface TranslatorSignalParams {
	key: TranslatorLeafKeys<Parameters<ReturnType<typeof useTranslation>["t"]>[0]>;
	args?: Parameters<ReturnType<typeof useTranslation>["t"]>[1];
}

export const summonPasswordEditPopUp = (onClose: () => void) => summonPopUp((popUpControls) => {
	const { t } = useTranslation();

	const [error, setError] = createSignal<TranslatorSignalParams | null>(null);

	const changePasswordMutation = client.auth.changePassword.createMutation();

	let oldPasswordInput!: HTMLInputElement;
	let newPasswordInput!: HTMLInputElement;

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		setError(null);

		changePasswordMutation.mutate(
			{ body: { oldPassword: oldPasswordInput.value, newPassword: newPasswordInput.value } },
			{
				onSuccess: () => {
					summonSuccessToast(() => t("pages.settings.account.password.popUp.success"));
					popUpControls.close();
				},
				onError: (e) => {
					if (e.status !== 403) {
						summonErrorToast(() => t("pages.settings.account.password.popUp.failureNoReason"));
						popUpControls.close();
					} else if (e.body.code !== "INVALID_PASSWORD") {
						summonErrorToast(() => t("pages.settings.account.password.popUp.failure", { reason: e.body.message }));
						popUpControls.close();
					} else {
						setError({ key: "errors.auth.invalidPassword" });
					}
				},
			},
		);
	}

	onMount(() => {
		oldPasswordInput.focus();
	});

	return <Form onSubmit={handleSubmit}>
		<h2>{t("pages.settings.account.password.popUp.title")}</h2>
		<div class="pop-up-inputs">
			<TextInput ref={(e) => oldPasswordInput = e.htmlElement} placeholder={t("pages.settings.account.password.popUp.placeholder.old")} type="password" validator={(e) => validateFromZod(changePasswordSchema.shape.oldPassword, e.value)} required/>
			<TextInput ref={(e) => newPasswordInput = e.htmlElement} placeholder={t("pages.settings.account.password.popUp.placeholder.new")} type="password" validator={(e) => validateFromZod(changePasswordSchema.shape.newPassword, e.value)} required />
			<TextInput placeholder={t("pages.settings.account.password.popUp.placeholder.confirm")} type="password" validator={(e) => e.value !== newPasswordInput.value && t("errors.input.text.password.confirmationMismatch")} />
			<Show when={error()}>
				{(err) => <p class="invalid-message" role="alert">
					{t(err().key, err().args)}
				</p>}
			</Show>
		</div>
		<div class="pop-up-buttons">
			<Button type="button" onClick={popUpControls.close} variant="text" size="md">{t("pages.settings.cancel")}</Button>
			<Button type="submit" size="md" disabled={changePasswordMutation.isPending}>{t("pages.settings.confirm")}</Button>
		</div>
	</Form>;
}, { customClass: "edition-pop-up", onClose });
