import { Show } from "solid-js";
import { A } from "@solidjs/router";
import { Lock, Plus } from "lucide-solid";
import type { PlaylistSummaryDto } from "@flex/shared";
import { env } from "~/env";
import "./PlaylistCard.scss";

type PlaylistCardProps = {
	playlist: PlaylistSummaryDto;
	showOwner?: boolean;
	variant?: "card" | "row";
};

export default function PlaylistCard(props: PlaylistCardProps) {
	return <A class={`playlist-card ${props.variant === "row" ? "playlist-card--row" : ""}`} href={`/playlist/${props.playlist.uuid}`}>
		<img src={`${env.VITE_API_URL}/playlists/${props.playlist.uuid}/cover`} alt="" />
		<div class="playlist-card-info">
			<h4>
				{props.playlist.name}
				<Show when={props.playlist.private}><Lock class="playlist-card-lock" size={14} aria-label="Private" /></Show>
			</h4>
			<p>
				{props.playlist.musicCount} musics
				<Show when={props.showOwner}> · {props.playlist.owner.username}</Show>
			</p>
		</div>
	</A>;
}

export function NewPlaylistCard(props: { onClick: () => void; variant?: "card" | "row" }) {
	const row = () => props.variant === "row";

	return <button type="button" class={`playlist-card playlist-card-new ${row() ? "playlist-card--row" : ""}`} onClick={() => props.onClick()}>
		<span class="playlist-card-new-icon"><Plus size={row() ? 24 : 40} /></span>
		<div class="playlist-card-info">
			<h4>New playlist</h4>
			<p>Create an empty playlist</p>
		</div>
	</button>;
}
