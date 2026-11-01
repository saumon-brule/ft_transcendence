import { createSignal, onCleanup, onMount } from "solid-js";
import { A } from "@solidjs/router";
import type { User } from "@flex/shared";

export type ProviderStatus = "pinging" | "online" | "offline";

type ProviderCardProps = {
	provider: User["ownedProviders"][number];
};

export default function ProviderCard(props: ProviderCardProps) {
	const [status, setStatus] = createSignal<ProviderStatus>("pinging");

	onMount(() => {
		const delay = 300 + Math.floor(Math.random() * 600);
		const timeout = window.setTimeout(() => {
			setStatus(Math.random() < 0.7 ? "online" : "offline");
		}, delay);

		onCleanup(() => window.clearTimeout(timeout));
	});

	const statusLabel = () => {
		if (status() === "online") return "Online";
		if (status() === "offline") return "Offline";
		return "Checking";
	};

	return <A class="provider-card" href={`/provider/${props.provider.uuid}`}>
		<div class="provider-info">
			<h4>{props.provider.name}</h4>
			<p>{props.provider.address}</p>
		</div>
		<div class={`provider-status ${status()}`}>
			<span class="provider-status-dot" aria-hidden="true" />
			<span>{statusLabel()}</span>
		</div>
	</A>;
}
