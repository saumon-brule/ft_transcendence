import { Match, Show, Switch } from "solid-js";
import { Dynamic } from "solid-js/web";
import { CircleX, CloudOff, LoaderCircle, TriangleAlert } from "lucide-solid";
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

const ICONS = {
	loading: LoaderCircle,
	offline: CloudOff,
	restricted: TriangleAlert,
	missing: CircleX,
} as const;

export default function UnavailableTrackRow(props: UnavailableTrackRowProps) {
	const Icon = () => ICONS[props.track.state];
	const title = () => ({
		loading: "Loading…",
		offline: "Unavailable track",
		restricted: "Restricted track",
		missing: "Track no longer exists",
	})[props.track.state];
	const description = () => ({
		loading: props.track.provider.name,
		offline: `${props.track.provider.name} is offline`,
		restricted: `You are not a member of ${props.track.provider.name}`,
		missing: `It was removed from ${props.track.provider.name}`,
	})[props.track.state];

	return <tr class={`track-state track-state--${props.track.state}`}>
		<td colSpan={props.columns}>
			<div class="track-state-content">
				<div class="music-title">
					<span class="track-state-icon"><Dynamic component={Icon()} size={20} /></span>
					<div class="music-title-text">
						<span class="track-state-title">{title()}</span>
						<span class="track-state-description">{description()}</span>
					</div>
				</div>
				<Switch>
					<Match when={props.track.state === "restricted"}>
						<RestrictedActions track={props.track} />
					</Match>
					<Match when={props.track.state === "missing"}>
						<MissingActions track={props.track} playlist={props.playlist} />
					</Match>
				</Switch>
			</div>
		</td>
	</tr>;
}
