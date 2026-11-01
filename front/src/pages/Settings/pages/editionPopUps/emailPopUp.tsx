import { requestEmailResetSchema } from "@flex/shared";
import { Show } from "solid-js";
import { createSignal } from "solid-js";
import { client } from "~/api/client";
import Button from "~/components/inputs/Button";
import Form from "~/components/inputs/Form/Form";
import { summonPopUp } from "~/components/ui/Overlay";
import TextInput from "~/components/inputs/TextInput";
import { summonErrorToast, summonSuccessToast } from "~/components/ui/Toaster";
import { useTranslation } from "~/i18n/context";
import { TranslatorLeafKeys } from "~/types/generics/TranslatorLeafKeys";
import { validateFromZod } from "~/utils/validateFromZod";

interface TranslatorSignalParams {
	key: TranslatorLeafKeys<Parameters<ReturnType<typeof useTranslation>["t"]>[0]>;
	args?: Parameters<ReturnType<typeof useTranslation>["t"]>[1];
}

export const summonEmailEditPopUp = (onClose: () => void) => summonPopUp((popUpControls) => {
	const [error, setError] = createSignal<TranslatorSignalParams | null>(null);

	const { t } = useTranslation();

	const updateMeMutation = client.auth.requestEmailReset.createMutation();

	let newEmailInput!: HTMLInputElement;
	let passwordInput!: HTMLInputElement;

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		setError(null);

		updateMeMutation.mutate(
			{ body: { newEmail: newEmailInput.value, password: passwordInput.value } },
			{
				onSuccess: () => {
					summonSuccessToast(() => t("pages.settings.account.email.popUp.success"));
					popUpControls.close();
				},
				onError: (e) => {
					if (e.status !== 403) {
						summonErrorToast(() => t("pages.settings.account.email.popUp.failureNoReason"));
					} else if (e.body.code !== "INVALID_PASSWORD") {
						summonErrorToast(() => t("pages.settings.account.email.popUp.failure", { reason: e.body.message }));
					} else {
						setError({ key: "errors.auth.invalidPassword" });
					}
				},
			},
		);
	}

	return <Form onSubmit={handleSubmit}>
		<h2>{t("pages.settings.account.email.popUp.title")}</h2>
		<div class="pop-up-inputs">
			<TextInput ref={(e) => newEmailInput = e.htmlElement} placeholder={t("pages.settings.account.email.popUp.placeholder.newEmail")} type="email" validator={(e) => validateFromZod(requestEmailResetSchema.shape.newEmail, e.value)} required/>
			<TextInput ref={(e) => passwordInput = e.htmlElement} placeholder={t("pages.settings.account.email.popUp.placeholder.password")} type="password" validator={(e) => validateFromZod(requestEmailResetSchema.shape.password, e.value)} required />
			<Show when={error()}>
				{(err) => <p class="invalid-message" role="alert">
					{t(err().key, err().args)}
				</p>}
			</Show>
		</div>
		<div class="pop-up-buttons">
			<Button type="button" onClick={popUpControls.close} variant="text" size="md">{t("pages.settings.cancel")}</Button>
			<Button type="submit" size="md" disabled={updateMeMutation.isPending} >{t("pages.settings.confirm")}</Button>
		</div>
	</Form>;
}, { customClass: "edition-pop-up", onClose });
