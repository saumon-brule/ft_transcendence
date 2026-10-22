import { createEffect, createSignal, onMount, Show } from "solid-js";
import { A } from "@solidjs/router";
import { providerContract, type User } from "@flex/shared";
import { initQueryClient } from "@ts-rest/solid-query";
import Button from "~/components/inputs/Button";
import "./ProviderCard.scss";
import { queryKeyFromContract } from "~/api/utils/queryKeys";
import { summonEditProviderPopUp } from "./popUps/editProviderPopUp";
import { summonDeleteProviderPopUp } from "./popUps/deleteProviderPopUp";
import { client } from "~/api/client";
import { summonProviderKeyPopUp } from "./popUps/providerKeyPopUp";
import { summonErrorToast } from "~/components/ui/Toaster";

export type ProviderStatus = "pinging" | "online" | "offline";

type ProviderCardProps = {
	provider: User["ownedProviders"][number];
	mine: boolean;
};

export default function ProviderCard(props: ProviderCardProps) {
	const [status, setStatus] = createSignal<ProviderStatus>("pinging");
	const providerClient = initQueryClient(providerContract, {
		baseUrl: props.provider.address,
		baseHeaders: {
			Authorization: () => "Bearer ",
		},
	});
	const providerQueryKeys = queryKeyFromContract(providerContract);
	const health = providerClient.info.health.createQuery(providerQueryKeys.info.health, () => ({}));

	createEffect(() => {
		if (health.isSuccess) {
			setStatus("online");
		} else {
			setStatus("offline");
		}
	});

	onMount(() => {

	});

	const regenerateKeyMutation = client.providers.regenerateKey.createMutation();

	function regenerateKey(uuid: string) {
		regenerateKeyMutation.mutate(
			{ params: { uuid } },
			{
				onSuccess: (data) => {
					summonProviderKeyPopUp(data.body.apiKey);
				},
				onError: () => {
					summonErrorToast("Failed to regenerate provider key");
				},
			},
		);
	}

	const statusLabel = () => {
		if (status() === "online") return "Online";
		if (status() === "offline") return "Offline";
		return "Checking";
	};

	return <div class="provider-card">
		<div class="provider-details">
			<div class="provider-info">
				<h4><A href={`/provider/${props.provider.uuid}`}>
					{props.provider.name}
				</A></h4>
				<p>{props.provider.address}</p>
			</div>
			<Show when={props.mine}><div class="provider-actions">
				<Button type="button" onClick={() => summonEditProviderPopUp(props.provider)} variant="text" size="md">Edit</Button>
				<Button type="button" onClick={() => regenerateKey(props.provider.uuid)} variant="text" size="md">Regenerate Key</Button>
				<Button type="button" onClick={() => summonDeleteProviderPopUp(props.provider.uuid)} variant="text" size="md">Delete</Button>
			</div></Show>
		</div>
		<div class={`provider-status ${status()}`}>
			<span class="provider-status-dot" aria-hidden="true" />
			<span>{statusLabel()}</span>
		</div>
	</div>;
}
