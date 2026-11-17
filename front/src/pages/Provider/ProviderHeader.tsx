import type { ProviderDataDto, Provider } from "@flex/shared";
import { createEffect, Show } from "solid-js";
import { ProviderStatus } from "./Provider";
import Button from "~/components/inputs/Button/Button";
import { useLeaveProviderMutation, useAccessRequestQuery, useJoinProvider as useJoinProviderMutation, useProviderInfoInfoQuery } from "~/api/queryHooks/providerAccess";
import { DoorOpen, Pencil } from "lucide-solid";
import { summonPopUp } from "~/components/ui/Overlay";
// import { summonEditProviderPopUp } from "../Providers/popUps/editProviderPopUp";
import { useNavigate } from "@solidjs/router";

type ProviderHeaderProps = {
	provider: ProviderDataDto | undefined;
	providerBack: Provider;
	status: ProviderStatus;
};

function summonLeaveProviderPopUpConfirmation(leaveMutation: ReturnType<typeof useLeaveProviderMutation>, provider: Provider) {
	return summonPopUp((controls) => <div>
		<h3>Do you really want to leave <b>{provider.name}</b></h3>
		<Button variant="ghost" onClick={controls.close}>cancel</Button>
		<Button variant="danger" onClick={() => leaveMutation.mutate({})}>leave</Button>
	</div>, { customClass: "leave-probider-confirm-pop-up" });
}

export default function ProviderHeader(props: ProviderHeaderProps) {
	const info = useProviderInfoInfoQuery(() => props.providerBack);
	const requestQuery = useAccessRequestQuery(() => props.providerBack);
	const leaveMutation = useLeaveProviderMutation(() => props.providerBack);
	const joinMutation = useJoinProviderMutation();
	const pending = () => requestQuery.data === "PENDING" || (joinMutation.isSuccess && joinMutation.data === "PENDING");
	const navigate = useNavigate();

	createEffect(() => {
		console.log(info.data?.body);
	});

	return <header class="provider-header">
		<div class="content">
			<div class="provider-header-title">
				<h2>{props.providerBack.name}</h2>
				{/* <Button size="sm" variant="text" onClick={() => summonEditProviderPopUp(props.providerBack)}>edit</Button> */}
			</div>
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
		<Show when={props.status === "success" && (info.data?.body.member.isOwner === true || info.data?.body.member.permissions.length)}>
			<Button onClick={() => navigate(`/provider/${props.providerBack.uuid}/edit`)}><Pencil/>Edit</Button>
		</Show>
		<Show when={props.status === "success" && info.data?.body.member.isOwner === false}>
			<Button disabled={leaveMutation.isPending || requestQuery.isLoading} variant="danger" onClick={() => summonLeaveProviderPopUpConfirmation(leaveMutation, props.providerBack)} ><DoorOpen/>Leave Provider</Button>
		</Show>
		<Show when={props.status === "forbidden" && info.data?.body}>
			<Button disabled={pending() || joinMutation.isPending || requestQuery.isLoading} onClick={() => joinMutation.mutate(props.providerBack)}>
				{pending() ? "Pending request" : info.data?.body.visibility === "PUBLIC" ? "Join provider" : "Request access"}
			</Button>
		</Show>
	</header>;
}
