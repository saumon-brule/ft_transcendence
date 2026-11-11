import { createEffect, createSignal, onMount, Show } from "solid-js";
import { A, useNavigate } from "@solidjs/router";
import { type User } from "@flex/shared";
import Button from "~/components/inputs/Button";
import "./ProviderCard.scss";
import { summonEditProviderPopUp } from "../../../pages/Providers/popUps/editProviderPopUp";
import { summonDeleteProviderPopUp } from "../../../pages/Providers/popUps/deleteProviderPopUp";
import { client } from "~/api/client";
import { summonProviderKeyPopUp } from "../../../pages/Providers/popUps/providerKeyPopUp";
import { summonErrorToast } from "~/components/ui/Toaster";
import { getProviderClient } from "~/api/providerClients";
import { createMemo } from "solid-js";
import { createQuery } from "@tanstack/solid-query";

export type ProviderStatus = "pinging" | "online" | "offline";

type ProviderCardProps = {
	provider: User["ownedProviders"][number];
	mine: boolean;
	small?: boolean;
};

export default function ProviderCard(props: ProviderCardProps) {
	const [status, setStatus] = createSignal<ProviderStatus>("pinging");
	const provider = createMemo(() => getProviderClient(props.provider.address, props.provider.uuid));
	const health = createQuery({
		queryKey: () => provider().keys.info.health(),
		queryFn: async () => {
			const res = await provider().client.info.health.query();
			if (res.status !== 200) throw new Error(`Provider health check failed with status ${res.status}`);
			return res;
		},
	});
	const navigate = useNavigate();

	createEffect(() => {
		if (health.isSuccess) {
			setStatus("online");
		} else if (health.isError) {
			setStatus("offline");
		} else {
			setStatus("pinging");
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
					summonErrorToast(() => "Failed to regenerate provider key");
				},
			},
		);
	}

	const statusLabel = () => {
		if (status() === "online") return "Online";
		if (status() === "offline") return "Offline";
		return "Checking";
	};

	return <div class={`provider-card ${props.small ? "small" : ""}`} onClick={() => navigate(`/provider/${props.provider.uuid}`)}>
		<div class="provider-details">
			<div class="provider-info">
				<h4><A href={`/provider/${props.provider.uuid}`}>
					{props.provider.name}
				</A></h4>
				<p>{props.provider.address}</p>
			</div>
			<Show when={props.mine}><div class="provider-actions">
				<Button type="button" onClick={(e) => { e.stopPropagation(); summonEditProviderPopUp(props.provider); }} variant="text" size="md">Edit</Button>
				<Button type="button" onClick={(e) => { e.stopPropagation(); regenerateKey(props.provider.uuid); }} variant="text" size="md">Regenerate Key</Button>
				<Button type="button" onClick={(e) => { e.stopPropagation(); summonDeleteProviderPopUp(props.provider.uuid); }} variant="text" size="md">Delete</Button>
			</div></Show>
		</div>
		<div class={`provider-status ${status()}`}>
			<span class="provider-status-dot" aria-hidden="true" />
			<span class="provider-status-label">{statusLabel()}</span>
		</div>
	</div>;
}
