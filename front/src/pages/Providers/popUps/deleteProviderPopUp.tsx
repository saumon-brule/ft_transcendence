import { serverContract } from "@flex/shared";
import { type ClientInferResponses } from "@ts-rest/core";
import { queryClient } from "~/api/queryClient";
import { client, queryKeys } from "~/api/client";
import Button from "~/components/inputs/Button";
import Form from "~/components/inputs/Form/Form";
import { summonPopUp } from "~/components/ui/overlays/Overlay";
import { summonErrorToast, summonSuccessToast } from "~/components/ui/feedback/Toaster";
import { t } from "~/i18n/context";

export const summonDeleteProviderPopUp = (providerUUID: string, onClose?: () => void) => summonPopUp((popUpControls) => {
	const deleteProviderMutation = client.providers.delete.createMutation();

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		deleteProviderMutation.mutate(
			{ params: { uuid: providerUUID } },
			{
				onSuccess: () => {
					queryClient.setQueryData<ClientInferResponses<typeof serverContract.users.me, 200>>(
						queryKeys.users.me(),
						(old) => old && {
							...old,
							body: {
								...old.body,
								ownedProviders: old.body.ownedProviders.filter((p) => p.uuid !== providerUUID),
							},
						},
					);
					summonSuccessToast(() => t("pages.providers.deletePopUp.success"));
					popUpControls.close();
				},
				onError: () => {
					summonErrorToast(() => t("pages.providers.deletePopUp.error"));
				},
			},
		);
	}

	return <Form onSubmit={handleSubmit}>
		<h2>{t("pages.providers.deletePopUp.title")}</h2>
		<div class="pop-up-inputs">
			<p>{t("pages.providers.deletePopUp.confirm")}</p>
		</div>
		<div class="pop-up-buttons">
			<Button type="button" onClick={popUpControls.close} variant="text" size="md">{t("common.cancel")}</Button>
			<Button type="submit" size="md" variant="danger" disabled={deleteProviderMutation.isPending}>{t("common.delete")}</Button>
		</div>
	</Form>;
}, { customClass: "provider-pop-up", onClose });
