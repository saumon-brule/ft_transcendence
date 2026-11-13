import { Match, Show, Switch } from "solid-js";
import Button from "~/components/inputs/Button";
import { useAccessRequestQuery, useJoinProvider } from "~/api/queryHooks/providerAccess";
import { useRemoveMusicFromPlaylist } from "~/api/queryHooks/playlist";
import type { UnavailableTrack } from "~/utils/playlistTracks";
import "./UnavailableTrackRow.scss";

export type PlaylistContext = {
	uuid: string;
	isOwner: boolean;
};

type UnavailableTrackRowProps = {
	track: UnavailableTrack;
	columns: number;
	playlist?: PlaylistContext;
};

function RestrictedActions(props: { track: UnavailableTrack }) {
	const request = useAccessRequestQuery(() => props.track.provider);
	const join = useJoinProvider();
	const pending = () => request.data === "PENDING" || (join.isSuccess && join.data === "PENDING");

	return <Show
		when={!pending()}
		fallback={<span class="track-state-note">Request pending</span>}
	>
		<Button
			size="sm"
			disabled={join.isPending || request.isLoading}
			onClick={() => join.mutate(props.track.provider)}
		>
			{request.data === "REJECTED"
				? "Request again"
				: "Request access"}
		</Button>
	</Show>;
}

function MissingActions(props: { track: UnavailableTrack; playlist?: PlaylistContext }) {
	const remove = useRemoveMusicFromPlaylist(() => props.playlist?.uuid ?? "");

	return <Show when={props.playlist?.isOwner}>
		<Button
			size="sm"
			variant="danger"
			disabled={remove.isPending}
			onClick={() => remove.mutate({ musicUuid: props.track.musicUuid, providerUuid: props.track.provider.uuid })}
		>
			Remove
		</Button>
	</Show>;
}

export default function UnavailableTrackRow(props: UnavailableTrackRowProps) {
	return <tr class={`track-state track-state--${props.track.state}`}>
		<td colSpan={props.columns}>
			<div class="track-state-content">
				<Switch>
					<Match when={props.track.state === "loading"}>
						<span class="track-state-text">Loading…</span>
					</Match>
					<Match when={props.track.state === "offline"}>
						<span class="track-state-text">Unavailable, {props.track.provider.name} is offline</span>
					</Match>
					<Match when={props.track.state === "restricted"}>
						<span class="track-state-text">You are not a member of {props.track.provider.name}</span>
						<RestrictedActions track={props.track} />
					</Match>
					<Match when={props.track.state === "missing"}>
						<span class="track-state-text">This music no longer exists on {props.track.provider.name}</span>
						<MissingActions track={props.track} playlist={props.playlist} />
					</Match>
				</Switch>
			</div>
		</td>
	</tr>;
}
