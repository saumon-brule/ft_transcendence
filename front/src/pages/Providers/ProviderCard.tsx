import { createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { A } from "@solidjs/router";
import { HealthResponseDto, providerContract, type User } from "@flex/shared";
import { initQueryClient } from "@ts-rest/solid-query";

import "./ProviderCard.scss";
import { queryKeyFromContract } from "~/api/utils/queryKeys";

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
		// const delay = 300 + Math.floor(Math.random() * 600);
		// const timeout = window.setTimeout(() => {
		// 	setStatus(Math.random() < 0.7 ? "online" : "offline");
		// }, delay);


		// console.log(health);

		// onCleanup(() => window.clearTimeout(timeout));
	});

	const statusLabel = () => {
		if (status() === "online") return "Online";
		if (status() === "offline") return "Offline";
		return "Checking";
	};

	return <div class="provider-card">
		<div class="provider-info">
			<h4>{props.provider.name}</h4>
			<p>{props.provider.address}</p>
		</div>
		<div class={`provider-status ${status()}`}>
			<span class="provider-status-dot" aria-hidden="true" />
			<span>{statusLabel()}</span>
		</div>
	</div>;
}
