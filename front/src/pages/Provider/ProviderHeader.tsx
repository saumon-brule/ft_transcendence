import type { ProviderDataDto, Provider } from "@flex/shared";
import { Show } from "solid-js";
import { ProviderStatus } from "./Provider";
import Button from "~/components/inputs/Button/Button";
import { useLeaveProviderMutation, useAccessRequestQuery, useJoinProvider as useJoinProviderMutation, useProviderInfoInfoQuery } from "~/api/queryHooks/providerAccess";
import { DoorOpen, Pencil } from "lucide-solid";
import { summonPopUp } from "~/components/ui/Overlay";
// import { summonEditProviderPopUp } from "../Providers/popUps/editProviderPopUp";
import { useNavigate } from "@solidjs/router";
import { useProvider } from "~/components/guards/ProviderInfoGuard";

type ProviderHeaderProps = {
	provider: ProviderDataDto | undefined;
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
	const providerBack = useProvider();
	const info = useProviderInfoInfoQuery(() => providerBack);
	const requestQuery = useAccessRequestQuery(() => providerBack);
	const leaveMutation = useLeaveProviderMutation(() => providerBack);
	const joinMutation = useJoinProviderMutation();
	const pending = () => requestQuery.data === "PENDING" || (joinMutation.isSuccess && joinMutation.data === "PENDING");
	const navigate = useNavigate();

	return <header class="provider-header">
		<div class="content">
			<div class="provider-header-title">
				<h2>{providerBack.name}</h2>
				{/* <Button size="sm" variant="text" onClick={() => summonEditProviderPopUp(providerBack)}>edit</Button> */}
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
		<div class="action-buttons">
			<Show when={props.status === "success" && (info.data?.body.member.isOwner === true || info.data?.body.member.permissions.length)}>
				<Button onClick={() => navigate(`/provider/${providerBack.uuid}/edit`)}><Pencil/>Edit</Button>
			</Show>
			<Show when={props.status === "success" && info.data?.body.member.isOwner === false}>
				<Button disabled={leaveMutation.isPending || requestQuery.isLoading} variant="danger" onClick={() => summonLeaveProviderPopUpConfirmation(leaveMutation, providerBack)} ><DoorOpen/>Leave Provider</Button>
			</Show>
			<Show when={props.status === "forbidden" && info.data?.body}>
				<Button disabled={pending() || joinMutation.isPending || requestQuery.isLoading} onClick={() => joinMutation.mutate(providerBack)}>
					{pending() ? "Pending request" : info.data?.body.visibility === "PUBLIC" ? "Join provider" : "Request access"}
				</Button>
			</Show>
		</div>
	</header>;
}
