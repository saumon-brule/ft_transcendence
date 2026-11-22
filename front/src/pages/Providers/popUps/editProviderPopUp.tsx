import { serverContract, editProviderSchema, Provider } from "@flex/shared";
import { type ClientInferResponses } from "@ts-rest/core";
import { onMount } from "solid-js";
import { queryClient } from "~/api/queryClient";
import { client, queryKeys } from "~/api/client";
import Button from "~/components/inputs/Button";
import Form from "~/components/inputs/Form/Form";
import TextInput from "~/components/inputs/TextInput";
import { summonPopUp } from "~/components/ui/overlays/Overlay";
import { summonErrorToast, summonSuccessToast } from "~/components/ui/feedback/Toaster";
import { validateFromZod } from "~/utils/validateFromZod";
import { t } from "~/i18n/context";

export const summonEditProviderPopUp = (provider: Provider, onClose?: () => void) => summonPopUp((popUpControls) => {
	const editProviderMutation = client.providers.edit.createMutation();

	let nameInput!: HTMLInputElement;
	let addressInput!: HTMLInputElement;

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		editProviderMutation.mutate(
			{
				params: { uuid: provider.uuid },
				body: { name: nameInput.value, address: addressInput.value },
			},
			{
				onSuccess: (data) => {
					const provider = data.body;
					queryClient.setQueryData<ClientInferResponses<typeof serverContract.users.me, 200>>(
						queryKeys.users.me(),
						(old) => old && {
							...old,
							body: {
								...old.body,
								ownedProviders: old.body.ownedProviders.map((p) => p.uuid === provider.uuid ? { ...p, ...provider } : p),
							},
						},
					);
					summonSuccessToast(() => t("pages.providers.editPopUp.success"));
					popUpControls.close();
				},
				onError: () => {
					summonErrorToast(() => t("pages.providers.editPopUp.error"));
				},
			},
		);
	}

	onMount(() => {
		nameInput.focus();
	});

	return <Form onSubmit={handleSubmit}>
		<h2>{t("pages.providers.editPopUp.title")}</h2>
		<div class="pop-up-inputs">
			<TextInput ref={(e) => nameInput = e.htmlElement} name="providerName" value={provider.name} placeholder={t("pages.providers.namePlaceholder")} type="text" validator={(e) => validateFromZod(editProviderSchema.shape.name, e.value)} required/>
			<TextInput ref={(e) => addressInput = e.htmlElement} name="providerAddress" value={provider.address} placeholder={t("pages.providers.addressPlaceholder")} type="url" validator={(e) => validateFromZod(editProviderSchema.shape.address, e.value)} required/>
		</div>
		<div class="pop-up-buttons">
			<Button type="button" onClick={popUpControls.close} variant="text" size="md">{t("common.cancel")}</Button>
			<Button type="submit" size="md" disabled={editProviderMutation.isPending}>{t("common.save")}</Button>
		</div>
	</Form>;
}, { customClass: "provider-pop-up", onClose });
