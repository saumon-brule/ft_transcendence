import { appContract } from "@flex/shared";
import { type ClientInferResponses } from "@ts-rest/core";
import { queryClient } from "~/App";
import { client, queryKeys } from "~/api/client";
import Button from "~/components/inputs/Button";
import Form from "~/components/inputs/Form/Form";
import { summonPopUp } from "~/components/ui/Overlay";
import { summonErrorToast, summonSuccessToast } from "~/components/ui/Toaster";

export const summonDeleteProviderPopUp = (providerUUID: string, onClose?: () => void) => summonPopUp((popUpControls) => {
	const deleteProviderMutation = client.providers.delete.createMutation();

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		deleteProviderMutation.mutate(
			{ params: { uuid: providerUUID } },
			{
				onSuccess: () => {
					queryClient.setQueryData<ClientInferResponses<typeof appContract.users.me, 200>>(
						queryKeys.users.me(),
						(old) => old && {
							...old,
							body: {
								...old.body,
								ownedProviders: old.body.ownedProviders.filter((p) => p.uuid !== providerUUID),
							},
						},
					);
					summonSuccessToast("Provider deleted successfully");
					popUpControls.close();
				},
				onError: () => {
					summonErrorToast("Failed to delete provider");
				},
			},
		);
	}

	return <Form onSubmit={handleSubmit}>
		<h2>Delete provider</h2>
		<div class="pop-up-inputs">
			<p>Are you sure you want to delete this provider? This action cannot be undone.</p>
		</div>
		<div class="pop-up-buttons">
			<Button type="button" onClick={popUpControls.close} variant="text" size="md">Cancel</Button>
			<Button type="submit" size="md" variant="danger" disabled={deleteProviderMutation.isPending}>Delete</Button>
		</div>
	</Form>;
}, { customClass: "provider-pop-up", onClose });
