import { appContract, createProviderSchema } from "@flex/shared";
import { type ClientInferResponses } from "@ts-rest/core";
import { onMount } from "solid-js";
import { queryClient } from "~/App";
import { client, queryKeys } from "~/api/client";
import Button from "~/components/inputs/Button";
import Form from "~/components/inputs/Form/Form";
import TextInput from "~/components/inputs/TextInput";
import Toggle from "~/components/inputs/Toggle/Toggle";
import { summonPopUp } from "~/components/ui/Overlay";
import { summonErrorToast, summonSuccessToast } from "~/components/ui/Toaster";
import { validateFromZod } from "~/utils/validateFromZod";
import { summonProviderKeyPopUp } from "./providerKeyPopUp";

export const summonNewProviderPopUp = (onClose?: () => void) => summonPopUp((popUpControls) => {
	const newProviderMutation = client.providers.create.createMutation();

	let nameInput!: HTMLInputElement;
	let addressInput!: HTMLInputElement;
	let publicDisplayInput!: HTMLInputElement;

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		newProviderMutation.mutate(
			{ body: { name: nameInput.value, address: addressInput.value, publicDisplay: publicDisplayInput.checked } },
			{
				onSuccess: (data) => {
					const { apiKey, ...provider } = data.body;
					queryClient.setQueryData<ClientInferResponses<typeof appContract.users.me, 200>>(
						queryKeys.users.me(),
						(old) => old && { ...old, body: { ...old.body, ownedProviders: [...old.body.ownedProviders, provider] } },
					);
					summonSuccessToast(() => "Provider created successfully");
					popUpControls.close();
					summonProviderKeyPopUp(apiKey);
				},
				onError: () => {
					summonErrorToast(() => "Failed to create provider");
				},
			},
		);
	}

	onMount(() => {
		nameInput.focus();
	});

	return <Form onSubmit={handleSubmit}>
		<h2>New provider</h2>
		<div class="pop-up-inputs">
			<TextInput ref={(e) => nameInput = e.htmlElement} name="providerName" placeholder="My provider" type="text" validator={(e) => validateFromZod(createProviderSchema.shape.name, e.value)} required/>
			<TextInput ref={(e) => addressInput = e.htmlElement} name="providerAddress" placeholder="https://my-provider.com" type="url" validator={(e) => validateFromZod(createProviderSchema.shape.address, e.value)} required/>
			<Toggle ref={(e) => publicDisplayInput = e} name="providerPublicDisplay" label="Public display" checked={true} />
		</div>
		<div class="pop-up-buttons">
			<Button type="button" onClick={popUpControls.close} variant="text" size="md">Cancel</Button>
			<Button type="submit" size="md" disabled={newProviderMutation.isPending}>Create</Button>
		</div>
	</Form>;
}, { customClass: "provider-pop-up", onClose });
