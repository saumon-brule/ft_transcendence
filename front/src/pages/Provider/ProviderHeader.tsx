import type { ProviderDataDto, Provider } from "@flex/shared";
import { Show } from "solid-js";
import { ProviderStatus } from "./Provider";
import Button from "~/components/inputs/Button/Button";
import { useAccessRequestQuery, useJoinProvider } from "~/api/queryHooks/providerAccess";

type ProviderHeaderProps = {
	provider: ProviderDataDto | undefined;
	providerBack: Provider;
	status: ProviderStatus;
};

export default function ProviderHeader(props: ProviderHeaderProps) {
	const request = useAccessRequestQuery(() => props.providerBack);
	const join = useJoinProvider();
	const pending = () => request.data === "PENDING" || (join.isSuccess && join.data === "PENDING");

	return <header class="provider-header">
		<div class="content">
			<h2>{props.providerBack.name}</h2>
			<Show when={props.provider}>{(provider) => <>
				<div class="header-info-items">
					<span class="stat">{provider().music.total} musics</span>
					<div class="separator"/>
					<span class="stat">{provider().artist.total} artists</span>
					<div class="separator"/>
					<span class="stat">{provider().album.total} albums</span>
				</div>
			</>}</Show>
		</div>
		<Show when={props.status === "success"}>
			<Button variant="danger">Leave Provider</Button>
			{/* Pas encore de leave */}
		</Show>
		<Show when={props.status === "forbidden"}>
			<Button disabled={pending() || join.isPending || request.isLoading} onClick={() => join.mutate(props.providerBack)}>{pending() ? "Pending request" : "Request access"}</Button>
		</Show>
	</header>;
}
