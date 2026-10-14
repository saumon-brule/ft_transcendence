import { updateMeSchema } from "@flex/shared";
import { onMount } from "solid-js";
import { client } from "~/api/client";
import Button from "~/components/ui/Button";
import Form from "~/components/ui/Form/Form";
import { summonPopUp } from "~/components/ui/Overlay";
import TextInput from "~/components/ui/TextInput";
import { summonErrorToast, summonSuccessToast } from "~/components/ui/Toaster";
import { useTranslation } from "~/i18n/context";
import { validateFromZod } from "~/utils/validateFromZod";

export const summonUsernameEditPopUp = (onClose: () => void) => summonPopUp((popUpControls) => {
	const { t } = useTranslation();

	const updateMeMutation = client.users.updateMe.createMutation();

	let newUsernameInput!: HTMLInputElement;

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		updateMeMutation.mutate(
			{ body: { username: newUsernameInput.value } },
			{
				onSuccess: () => {
					summonSuccessToast(() => t("pages.settings.account.username.popUp.success"));
					popUpControls.close();
				},
				onError: (e) => {
					if (e.status !== 403) {
						summonErrorToast(() => t("pages.settings.account.username.popUp.failureNoReason"));
						popUpControls.close();
					} else {
						summonErrorToast(() => t("pages.settings.account.username.popUp.failure", { reason: e.body.message }));
						popUpControls.close();
					}
				},
			},
		);
	}

	onMount(() => {
		newUsernameInput.focus();
	});

	return <Form onSubmit={handleSubmit}>
		<h2>{t("pages.settings.account.username.popUp.title")}</h2>
		<div class="pop-up-inputs">
			<TextInput ref={(e) => newUsernameInput = e.htmlElement} placeholder={t("pages.settings.account.username.popUp.placeholder")} type="text" validator={(e) => validateFromZod(updateMeSchema.shape.username, e.value)} required/>
		</div>
		<div class="pop-up-buttons">
			<Button type="button" onClick={popUpControls.close} variant="text" size="md">{t("pages.settings.cancel")}</Button>
			<Button type="submit" size="md" disabled={updateMeMutation.isPending} >{t("pages.settings.confirm")}</Button>
		</div>
	</Form>;
}, { customClass: "edition-pop-up", onClose });
