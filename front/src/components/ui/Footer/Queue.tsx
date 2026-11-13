import { Accessor, createEffect, on, Setter, Show } from "solid-js";
import Button from "~/components/inputs/Button";
import { useAudioManagerContext } from "~/components/context/AudioManagerContext";
import MusicCover from "../MusicCover";
import ArtistsLinks from "../ArtistLinks";
import { A, useLocation } from "@solidjs/router";
import MusicSection from "../MusicSection/MusicSection";
import { ChevronDown } from "lucide-solid";

import "./Queue.scss";
import { useTranslation } from "~/i18n/context";

export type QueueProps = {
	show: Accessor<boolean>;
	setShow: Setter<boolean>;
};

export default function Queue(props: QueueProps) {
	const location = useLocation();
	const { t } = useTranslation();
	const audioManager = useAudioManagerContext();

	createEffect(on(() => location.pathname, () => {
		props.setShow(false);
	}, { defer: true }));

	return <div id="queue" class={props.show() ? "show" : undefined}>
		<Button class="hide-queue-button" icon onClick={() => props.setShow(false)} >
			<ChevronDown/>
		</Button>
		<div>
			<div class="queue-header">
				<h1>{t("pages.queue.title")}</h1>
			</div>
			<div class="queue-body">
				<div class="queue-current-track" classList={{ "empty": audioManager.currentMusic === null }}>
					<Show when={audioManager.currentMusic} fallback={<img src="/images/default_cover.png" />} keyed>
						{(currentMusic) => <MusicCover music={currentMusic} />}
					</Show>
					<h2 class="track-name">
						<Show when={audioManager.currentMusic} fallback="-" keyed>
							{(currentMusic) => currentMusic.name}
						</Show>
					</h2>
					<h3 class="track-artists">
						<Show when={audioManager.currentMusic} fallback="-" keyed>
							{(currentMusic) => <ArtistsLinks artists={currentMusic.artists} providerUUID={currentMusic.providerUuid} />}
						</Show>
					</h3>
					<Show when={audioManager.currentMusic?.hasAlbum() && audioManager.currentMusic} fallback="-" keyed>
						{(music) => <h3 class="track-album">
							<A href={music.albumRoute()}>{music.album.name}</A>
						</h3>}
					</Show>
				</div>
				<div class="lists">
					<Show when={audioManager.queue.length > 0}>
						<div class="list-title">
							<h2>{t("pages.queue.queue")}</h2>
							<Button class="clear-queue-button" variant="text" onClick={() => audioManager.clearQueue()}>{t("pages.queue.queueClear")}</Button>
						</div>
						<div class="queue-list">
							<MusicSection musics={audioManager.queue}/>
						</div>
					</Show>
					<Show when={audioManager.musicGroup} keyed>
						{(musicGroup) => <div class="following-list">
							<div class="list-title"><h2>{t("pages.queue.following")}<A href={musicGroup.route}>{musicGroup.name}</A></h2></div>
							<MusicSection musics={musicGroup.musics.slice(audioManager.position + 1)} />
						</div>}
					</Show>
					<Show when={!audioManager.musicGroup && audioManager.queue.length === 0} keyed>
						<div>
							Rien à écouter ? :(
						</div>
					</Show>
				</div>
			</div>
		</div>
	</div>;
}
