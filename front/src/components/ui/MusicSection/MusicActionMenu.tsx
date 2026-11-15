import { useAudioManagerContext } from "~/components/context/AudioManagerContext";
import { ChevronLeft, ChevronRight, EighthNote, ListEnd, ListStart, Search } from "lucide-solid";
import TextInput from "~/components/inputs/TextInput";
import Form from "~/components/inputs/Form/Form";
import { useMeProfileQuery } from "~/api/queryHooks/meProfile";
import { useAddMusicToPlaylistMutation } from "~/api/queryHooks/playlist";
import { env } from "~/env";
import { createSignal, For, Match, Show, Switch } from "solid-js";
import { Music } from "~/class/Music";

export function MusicActionMenu(props: { music: Music; onClose: () => void }) {
	type MusicActionMenus = "main" | "playlist";
	const audioManager = useAudioManagerContext();
	const [currentMenu, setCurrentMenu] = createSignal<MusicActionMenus>("main");
	const meProfileQuery = useMeProfileQuery();
	const [searchQuery, setSearchQuery] = createSignal("");
	const addMusicToPlaylistMutation = useAddMusicToPlaylistMutation();

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

	return <div class="music-action-menu" role="menu">
		<Switch>
			<Match when={currentMenu() === "main"}>
				<div class="menu-content main-menu">
					<button type="button" role="menuitem" onClick={() => void playNext(props.music)}>
						<ListStart size={15} aria-hidden="true" />
						<span>Écouter après</span>
					</button>
					<button type="button" role="menuitem" onClick={() => void addToQueue(props.music)}>
						<ListEnd size={15} aria-hidden="true" />
						<span>Ajouter à la file d'attente</span>
					</button>
					<button type="button" role="menuitem" onClick={() => setCurrentMenu("playlist")}>
						<EighthNote size={15} aria-hidden="true" />
						<span>Ajouter à une playlist</span>
						<ChevronRight class="right" size={17} aria-hidden="true" />
					</button>
				</div>
			</Match>
			<Match when={currentMenu() === "playlist"}>
				<div class="menu-content playlist-submenu">
					<button type="button" role="menuitem" onClick={() => setCurrentMenu("main")}>
						<ChevronLeft size={15} aria-hidden="true" />
						<span>Back</span>
					</button>
					<span class="separator"/>
					<Form class="playlist-form" onSubmit={(e) => {
						e.preventDefault();
					}}>
						<Search class="search-icon" size={15}/>
						<TextInput value={searchQuery()} placeholder="Search playlist" type="text" onInput={(e) => setSearchQuery(e.currentTarget.value)} />
					</Form>
					<Show when={meProfileQuery.data?.body} keyed>{(meProfile) => <For each={meProfile.ownedPlaylists.filter((p) => p.name.toLowerCase().includes(searchQuery().toLowerCase())).slice(0, 5)}>{(playlist) => <button type="button" role="menuitem" onClick={() => addToPlaylist(playlist.uuid)}>
						<img src={`${env.VITE_API_URL}/playlists/${playlist.uuid}/cover`} alt="Playlist cover" />
						<span>{playlist.name}</span>
					</button>
					}</For>
					}</Show>
				</div>
			</Match>
		</Switch>
	</div>;
}
