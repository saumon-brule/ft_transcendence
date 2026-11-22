import { playlistCoverUrl } from "~/utils/playlistCover";
import { useAudioManagerContext } from "~/components/context/AudioManagerContext";
import { ChevronLeft, ChevronRight, Ellipsis, EighthNote, ListEnd, ListStart, Search, Trash } from "lucide-solid";
import TextInput from "~/components/inputs/TextInput";
import Form from "~/components/inputs/Form/Form";
import { useProfile } from "~/components/guards/ProfileGate";
import { useAddMusicToPlaylistMutation, useRemoveMusicFromPlaylistMutation } from "~/api/queryHooks/playlist";
import { createSignal, For, Match, Show, Switch } from "solid-js";
import { Music } from "~/class/Music";
import { PlaylistContext } from "./UnavailableTrackRow";
import { Menu } from "../Menu/Menu";
import Button from "~/components/inputs/Button";
import { useTranslation } from "~/i18n/context";

export function MusicActionMenu(props: { music: Music; playlist?: PlaylistContext }) {
	return <Menu
		class="music-action-menu"
		trigger={<Button class="action-button" icon={true} variant="text"><Ellipsis /></Button>}
	>
		{(close) => <MusicActionMenuContent music={props.music} playlist={props.playlist} onClose={close} />}
	</Menu>;
}

function MusicActionMenuContent(props: { music: Music; playlist?: PlaylistContext; onClose: () => void }) {
	type MusicActionMenus = "main" | "playlist";
	const { t } = useTranslation();
	const audioManager = useAudioManagerContext();
	const [currentMenu, setCurrentMenu] = createSignal<MusicActionMenus>("main");
	const me = useProfile();
	const [searchQuery, setSearchQuery] = createSignal("");
	const addMusicToPlaylistMutation = useAddMusicToPlaylistMutation();
	const removeMusicFromPlaylistMutation = useRemoveMusicFromPlaylistMutation();

	function addToQueue(music: Music) {
		audioManager.pushMusicToQueue(music);
		props.onClose();
	}

	function playNext(music: Music) {
		audioManager.pushMusicToQueueTop(music);
		props.onClose();
	}

	function addToPlaylist(playlistUUID: string) {
		addMusicToPlaylistMutation.mutate({
			params: { uuid: playlistUUID },
			body: { musicUUID: props.music.uuid, providerUUID: props.music.provider.uuid },
		});
		props.onClose();
	}

	function removeMusicFromPlaylist() {
		if (!props.playlist) return;
		removeMusicFromPlaylistMutation.mutate({
			params: { uuid: props.playlist?.uuid },
			body: { musicUUID: props.music.uuid, providerUUID: props.music.provider.uuid },
		});
		props.onClose();
	}

	return <Switch>
		<Match when={currentMenu() === "main"}>
			<>
				<button type="button" role="menuitem" onClick={() => void playNext(props.music)}>
					<ListStart size={15} aria-hidden="true" />
					<span>{t("components.musicActionMenu.playNext")}</span>
				</button>
				<button type="button" role="menuitem" onClick={() => void addToQueue(props.music)}>
					<ListEnd size={15} aria-hidden="true" />
					<span>{t("components.musicActionMenu.addToQueue")}</span>
				</button>
				<Show when={props.playlist && props.playlist.isOwner === true} keyed>
					<button class="red-button" type="button" role="menuitem" onClick={() => removeMusicFromPlaylist()}>
						<Trash size={15} aria-hidden="true" />
						<span>{t("components.musicActionMenu.removeFromPlaylist")}</span>
					</button>
				</Show>
				<Show when={!(props.playlist && props.playlist.isOwner === true)}>
					<button type="button" role="menuitem" onClick={() => setCurrentMenu("playlist")}>
						<EighthNote size={15} aria-hidden="true" />
						<span>{t("components.musicActionMenu.addToPlaylist")}</span>
						<ChevronRight class="right" size={17} aria-hidden="true" />
					</button>
				</Show>
			</>
		</Match>
		<Match when={currentMenu() === "playlist"}>
			<>
				<button type="button" role="menuitem" onClick={() => setCurrentMenu("main")}>
					<ChevronLeft size={15} aria-hidden="true" />
					<span>{t("common.back")}</span>
				</button>
				<span class="separator"/>
				<Form class="playlist-form search-form" onSubmit={(e) => {
					e.preventDefault();
				}}>
					<Search class="search-icon" size={15}/>
					<TextInput value={searchQuery()} placeholder={t("components.musicActionMenu.searchPlaylist")} type="text" onInput={(e) => setSearchQuery(e.currentTarget.value)} />
				</Form>
				<For each={me().ownedPlaylists.filter((p) => p.name.toLowerCase().includes(searchQuery().toLowerCase())).slice(0, 5)}>{(playlist) => <button type="button" role="menuitem" onClick={() => addToPlaylist(playlist.uuid)}>
					<img src={playlistCoverUrl(playlist.uuid)} alt={t("common.playlistCover")} />
					<span>{playlist.name}</span>
				</button>
				}</For>
			</>
		</Match>
	</Switch>;
}
