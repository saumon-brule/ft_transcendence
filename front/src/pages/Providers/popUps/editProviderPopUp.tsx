import { serverContract, editProviderSchema, Provider } from "@flex/shared";
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

export const summonEditProviderPopUp = (provider: Provider, onClose?: () => void) => summonPopUp((popUpControls) => {
	const editProviderMutation = client.providers.edit.createMutation();

	let nameInput!: HTMLInputElement;
	let addressInput!: HTMLInputElement;
	let publicDisplayInput!: HTMLInputElement;

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		editProviderMutation.mutate(
			{
				params: { uuid: provider.uuid },
				body: { name: nameInput.value, address: addressInput.value, publicDisplay: publicDisplayInput.checked },
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
					summonSuccessToast(() => "Provider updated successfully");
					popUpControls.close();
				},
				onError: () => {
					summonErrorToast(() => "Failed to update provider");
				},
			},
		);
	}

	onMount(() => {
		nameInput.focus();
	});

	return <Form onSubmit={handleSubmit}>
		<h2>Edit provider</h2>
		<div class="pop-up-inputs">
			<TextInput ref={(e) => nameInput = e.htmlElement} name="providerName" value={provider.name} placeholder="My provider" type="text" validator={(e) => validateFromZod(editProviderSchema.shape.name, e.value)} required/>
			<TextInput ref={(e) => addressInput = e.htmlElement} name="providerAddress" value={provider.address} placeholder="https://my-provider.com" type="url" validator={(e) => validateFromZod(editProviderSchema.shape.address, e.value)} required/>
			<Toggle ref={(e) => publicDisplayInput = e} name="providerPublicDisplay" label="Public display" checked={provider.publicDisplay} />
		</div>
		<div class="pop-up-buttons">
			<Button type="button" onClick={popUpControls.close} variant="text" size="md">Cancel</Button>
			<Button type="submit" size="md" disabled={editProviderMutation.isPending}>Save</Button>
		</div>
	</Form>;
}, { customClass: "provider-pop-up", onClose });
