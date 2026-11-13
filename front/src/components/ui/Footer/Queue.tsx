import { Accessor, createEffect, on, Setter, Show } from "solid-js";
import Button from "~/components/inputs/Button";
import { useAudioManagerContext } from "~/components/context/AudioManagerContext";
import MusicCover from "../MusicCover";
import ArtistsLinks from "../ArtistLinks";
import { A, useLocation } from "@solidjs/router";
import MusicSection from "../MusicSection/MusicSection";
import { ChevronDown } from "lucide-solid";

import "./Queue.scss";

export type QueueProps = {
	show: Accessor<boolean>;
	setShow: Setter<boolean>;
};

export default function Queue(props: QueueProps) {
	const location = useLocation();
	const audioManager = useAudioManagerContext();

	createEffect(on(() => [location.query, location.pathname], () => {
		props.setShow(false);
	}));

	const followingMusics = () => audioManager.musicList.slice(audioManager.position + 1);

	return <div id="queue" class={props.show() ? "show" : undefined}>
		<Button class="hide-queue-button" icon onClick={() => props.setShow(false)} >
			<ChevronDown/>
		</Button>
		<div>
			<div class="queue-header">
				<h1>Queue</h1>
			</div>
			<div class="queue-body">
				<div class={`current-track${audioManager.currentMusic === null ? " empty" : ""}`}>
					<Show when={audioManager.currentMusic} fallback={<img src="/images/default_cover.png" />} keyed>
						{(currentMusic) => <MusicCover music={currentMusic} />}
					</Show>
					<h2 class="track-name">
						<Show when={audioManager.currentMusic} fallback="-" keyed>
							{(currentMusic) => currentMusic.name}
						</Show>
					</h2>
					<h3 class="track-name">
						<Show when={audioManager.currentMusic} fallback="-" keyed>
							{(currentMusic) => <ArtistsLinks artists={currentMusic.artists} providerUUID={currentMusic.providerUuid} />}
						</Show>
					</h3>
				</div>
				<div class="lists">
					<Show when={audioManager.queue.length > 0}>
						<h2>File d'attente</h2>
						<div class="queue-list">
							<MusicSection musics={audioManager.queue}/>
						</div>
					</Show>
					<div class="following-list">
						<h2>A suivre dans <A href="provider/xxxx/artist/xxxx">Ado</A></h2>
						<MusicSection musics={followingMusics()}/>
					</div>
				</div>
			</div>
		</div>
	</div>;
}
