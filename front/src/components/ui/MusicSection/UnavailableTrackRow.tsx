import { Match, Show, Switch } from "solid-js";
import { Dynamic } from "solid-js/web";
import { CircleX, CloudOff, LoaderCircle, TriangleAlert } from "lucide-solid";
import Button from "~/components/inputs/Button";
import { useAccessRequestQuery, useJoinProvider } from "~/api/queryHooks/providerAccess";
import { useRemoveMusicFromPlaylistMutation } from "~/api/queryHooks/playlist";
import "./UnavailableTrackRow.scss";
import { Music, UnavailableMusic } from "~/class/Music";

export type PlaylistContext = {
	uuid: string;
	isOwner: boolean;
};

type UnavailableTrackRowProps = {
	music: UnavailableMusic;
	columns: number;
	playlist?: PlaylistContext;
};

function RestrictedActions(props: { track: Music }) {
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

function MissingActions(props: { music: Music; playlist?: PlaylistContext }) {
	const remove = useRemoveMusicFromPlaylistMutation();

	return <Show when={props.playlist?.isOwner}>
		<Button
			size="sm"
			variant="danger"
			disabled={remove.isPending}
			onClick={() => remove.mutate({
				params: { uuid: props.playlist?.uuid ?? "" },
				body: { musicUUID: props.music.uuid, providerUUID: props.music.provider.uuid },
			})}
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

export default function UnavailableMusicRow(props: UnavailableTrackRowProps) {
	const Icon = () => ICONS[props.music.state];
	const title = () => ({
		loading: "Loading…",
		offline: "Unavailable track",
		restricted: "Restricted track",
		missing: "Track no longer exists",
	})[props.music.state];
	const description = () => ({
		loading: props.music.provider.name,
		offline: `${props.music.provider.name} is offline`,
		restricted: `You are not a member of ${props.music.provider.name}`,
		missing: `It was removed from ${props.music.provider.name}`,
	})[props.music.state];

	return <tr class={`track-state track-state--${props.music.state}`}>
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
					<Match when={props.music.state === "restricted"}>
						<RestrictedActions track={props.music} />
					</Match>
					<Match when={props.music.state === "missing"}>
						<MissingActions music={props.music} playlist={props.playlist} />
					</Match>
				</Switch>
			</div>
		</td>
	</tr>;
}
