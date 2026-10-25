import { appContract, updateMeSchema } from "@flex/shared";
import { onMount } from "solid-js";
import { client, queryKeys } from "~/api/client";
import Button from "~/components/inputs/Button";
import Form from "~/components/inputs/Form/Form";
import { summonPopUp } from "~/components/ui/Overlay";
import TextInput from "~/components/inputs/TextInput";
import { summonErrorToast, summonSuccessToast } from "~/components/ui/Toaster";
import { useTranslation } from "~/i18n/context";
import { validateFromZod } from "~/utils/validateFromZod";
import { queryClient } from "~/App";
import { ClientInferResponses } from "@ts-rest/core";

type UserMeResponse = ClientInferResponses<typeof appContract.users.me, 200>;

export const summonUsernameEditPopUp = (onClose: () => void) => summonPopUp((popUpControls) => {
	const { t } = useTranslation();

	const updateMeMutation = client.users.updateMe.createMutation();

	let newUsernameInput!: HTMLInputElement;

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		const newUsername = newUsernameInput.value;

		updateMeMutation.mutate(
			{ body: { username: newUsername } },
			{
				onSuccess: () => {
					summonSuccessToast(() => t("pages.settings.account.username.popUp.success"));
					queryClient.setQueryData<UserMeResponse>(queryKeys.users.me(), (old) => {
						if (!old) return old;
						return {
							...old,
							body: { ...old.body, username: newUsername },
						};
					});

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
