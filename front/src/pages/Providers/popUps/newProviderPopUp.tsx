import { serverContract, createProviderSchema } from "@flex/shared";
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
import { validateProviderAddress } from "~/utils/validateProviderAddress";
import { t } from "~/i18n/context";
import { summonProviderKeyPopUp } from "./providerKeyPopUp";

export const summonNewProviderPopUp = (onClose?: () => void) => summonPopUp((popUpControls) => {
	const newProviderMutation = client.providers.create.createMutation();

	let nameInput!: HTMLInputElement;
	let addressInput!: HTMLInputElement;

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		newProviderMutation.mutate(
			{ body: { name: nameInput.value, address: addressInput.value } },
			{
				onSuccess: (data) => {
					const { apiKey, ...provider } = data.body;
					queryClient.setQueryData<ClientInferResponses<typeof serverContract.users.me, 200>>(
						queryKeys.users.me(),
						(old) => old && { ...old, body: { ...old.body, ownedProviders: [...old.body.ownedProviders, provider] } },
					);
					summonSuccessToast(() => t("pages.providers.newPopUp.success"));
					popUpControls.close();
					summonProviderKeyPopUp(apiKey);
				},
				onError: () => {
					summonErrorToast(() => t("pages.providers.newPopUp.error"));
				},
			},
		);
	}

	onMount(() => {
		nameInput.focus();
	});

	return <Form onSubmit={handleSubmit}>
		<h2>{t("pages.providers.newPopUp.title")}</h2>
		<div class="pop-up-inputs">
			<TextInput ref={(e) => nameInput = e.htmlElement} name="providerName" placeholder={t("pages.providers.namePlaceholder")} type="text" validator={(e) => validateFromZod(createProviderSchema.shape.name, e.value)} required/>
			<TextInput ref={(e) => addressInput = e.htmlElement} name="providerAddress" placeholder={t("pages.providers.addressPlaceholder")} type="url" validator={(e) => validateProviderAddress(e.value)} required/>
		</div>
		<div class="pop-up-buttons">
			<Button type="button" onClick={popUpControls.close} variant="text" size="md">{t("common.cancel")}</Button>
			<Button type="submit" size="md" disabled={newProviderMutation.isPending}>{t("common.create")}</Button>
		</div>
	</Form>;
}, { customClass: "provider-pop-up", onClose });
