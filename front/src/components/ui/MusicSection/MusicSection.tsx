import { createSelector, createSignal, For, Match, onCleanup, onMount, Show, Switch } from "solid-js";
import { useAudioManagerContext } from "~/components/context/AudioManagerContext";
import { Music } from "~/class/Music";
import "./MusicSection.scss";
import { A } from "@solidjs/router";
import Button from "~/components/inputs/Button";
import MusicCover from "../MusicCover";
import ArtistsLinks from "../ArtistLinks";
import { formatTimer } from "~/components/common/MusicTimer/MusicTimer";
import { Provider } from "@flex/shared";
import { MusicGroup } from "~/store/trackManager.store";
import UnavailableMusicRow, { type PlaylistContext } from "./UnavailableTrackRow";
import { ChevronLeft, ChevronRight, EighthNote, Ellipsis, ListEnd, ListStart, Search } from "lucide-solid";
import TextInput from "~/components/inputs/TextInput";
import Form from "~/components/inputs/Form/Form";
import { useMeProfileQuery } from "~/api/queryHooks/meProfile";
import { useAddMusicToPlaylist } from "~/api/queryHooks/playlist";
import { env } from "~/env";

export type MusicSectionColumn = "actions" | "artists" | "album" | "published" | "duration";

function isGroupMusicSection(props: MusicSectionProps | GroupMusicSectionProps): props is GroupMusicSectionProps {
	return "musicGroup" in props;
}

export type MusicSectionProps = {
	hiddenColumns?: MusicSectionColumn[];
	providers?: Provider[];
	playlist?: PlaylistContext;
	musics: Array<Music>;
};

export type GroupMusicSectionProps = {
	hiddenColumns?: MusicSectionColumn[];
	providers?: Provider[];
	showCurrent?: boolean;
	playlist?: PlaylistContext;
	musicGroup: MusicGroup;
};

export default function MusicSection(props: MusicSectionProps | GroupMusicSectionProps) {
	const audioManager = useAudioManagerContext();
	const shown = (column: MusicSectionColumn) => !props.hiddenColumns?.includes(column);
	const [openMenu, setOpenMenu] = createSignal<Music | null>(null);
	const isMenuOpen = createSelector(openMenu);

	function toDate(value: Date | string): Date {
		return value instanceof Date ? value : new Date(value);
	}

	function handleMusicClick(index: number) {
		if (isGroupMusicSection(props)) {
			audioManager.setMusicGroup(props.musicGroup);
			audioManager.position = index;
		} else {
			audioManager.setCurrentMusic(props.musics[index]);
		}
		audioManager.play();
	}

	const columnCount = () => 1
		+ (shown("actions") ? 1 : 0)
		+ (shown("artists") ? 1 : 0)
		+ (shown("album") ? 1 : 0)
		+ (props.providers?.length ? 1 : 0)
		+ (shown("published") ? 1 : 0)
		+ (shown("duration") ? 1 : 0);


	function toggleMenu(music: Music) {
		setOpenMenu((current) => current === music ? null : music);
	}

	onMount(() => {
		const onPointerDown = (e: PointerEvent) => {
			if (!(e.target as Element | null)?.closest(".col-actions")) {
				setOpenMenu(null);
			}
		};
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpenMenu(null);
		};
		document.addEventListener("pointerdown", onPointerDown);
		document.addEventListener("keydown", onKeyDown);
		onCleanup(() => {
			document.removeEventListener("pointerdown", onPointerDown);
			document.removeEventListener("keydown", onKeyDown);
		});
	});

	const musicList = () => isGroupMusicSection(props) ? props.musicGroup.musics : props.musics;

	return <div class="music-section">
		<table class="data">
			<thead>
				<tr>
					<th class="col-title" scope="col">Title</th>
					<Show when={shown("actions")}><th class="col-actions" scope="col"></th></Show>
					<Show when={shown("artists")}><th class="col-artists" scope="col">Artists</th></Show>
					<Show when={shown("album")}><th class="col-album" scope="col">Album</th></Show>
					<Show when={props.providers?.length}><th class="col-provider" scope="col">Provider</th></Show>
					<Show when={shown("published")}><th class="col-published" scope="col">Published</th></Show>
					<Show when={shown("duration")}><th class="col-duration" scope="col">Duration</th></Show>
				</tr>
			</thead>
			<tbody>
				<For each={musicList()}>
					{(music, i) => <Switch>
						<Match when={music.isUnavailable() && music} keyed>
							{(unavailableMusic) => <UnavailableMusicRow music={unavailableMusic} columns={columnCount()} playlist={props.playlist} />}
						</Match>
						<Match when={!music.isUnavailable() && music}>
							<tr>
								<td class="col-title">
									<div class="music-title">
										<MusicCover music={music} />
										<div class="music-title-text">
											<Button variant="text" onClick={() => handleMusicClick(i())}>{music.name}</Button>
											<Show when={shown("artists")}>
												<span class="music-title-artists">
													<ArtistsLinks artists={music.artists} providerUUID={music.provider.uuid} />
												</span>
											</Show>
										</div>
									</div>
								</td>
								<Show when={shown("actions")}>
									<td class="col-actions">
										<Button class="action-button" icon={true} variant="text" onClick={() => toggleMenu(music)}><Ellipsis /></Button>
										<Show when={isMenuOpen(music)}>
											<MusicActionMenu music={music} onClose={() => setOpenMenu(null)} />
										</Show>
									</td>
								</Show>
								<Show when={shown("artists")}><td class="col-artists"><ArtistsLinks artists={music.artists} providerUUID={music.provider.uuid} /></td></Show>
								<Show when={shown("album")}><td class="col-album">{music.hasAlbum() ? <A href={music.albumRoute()} class="white-variant">{music.album.name}</A> : "-"}</td></Show>
								<Show when={props.providers?.length}><td class="col-provider"><A href={`/provider/${music.provider.uuid}`}>{props.providers?.find((provider) => provider.uuid === music.provider.uuid)?.name}</A></td></Show>
								<Show when={shown("published")}><td class="col-published">{music.publishedAt ? toDate(music.publishedAt).toLocaleDateString() : "-"}</td></Show>
								<Show when={shown("duration")}><td class="col-duration">{formatTimer(music.duration)}</td></Show>
							</tr>
						</Match>
					</Switch>}
				</For>
			</tbody>
		</table>
	</div>;
}

function MusicActionMenu(props: { music: Music; onClose: () => void }) {
	type MusicActionMenus = "main" | "playlist";
	const audioManager = useAudioManagerContext();
	const [currentMenu, setCurrentMenu] = createSignal<MusicActionMenus>("main");
	const meProfileQuery = useMeProfileQuery();
	const [searchQuery, setSearchQuery] = createSignal("");
	const addMusicToPlaylist = useAddMusicToPlaylist();

	function addToQueue(music: Music) {
		audioManager.pushMusicToQueue(music);
		props.onClose();
	}

	function playNext(music: Music) {
		audioManager.pushMusicToQueueTop(music);
		props.onClose();
	}

	function addToPlaylist(playlistUUID: string) {
		addMusicToPlaylist.mutate({
			playlistUuid: playlistUUID,
			musicUuid: props.music.uuid,
			providerUuid: props.music.provider.uuid,
		});
		props.onClose();
	}

	return <div class="music-action-menu" role="menu">
		<Switch>
			<Match when={currentMenu() === "main"}>
				<div class="menu-content main-menu">
					<button type="button" role="menuitem" onClick={() => void playNext(props.music) }>
						<ListStart size={15} aria-hidden="true" />
						<span>Écouter après</span>
					</button>
					<button type="button" role="menuitem" onClick={() => void addToQueue(props.music) }>
						<ListEnd size={15} aria-hidden="true" />
						<span>Ajouter à la file d'attente</span>
					</button>
					<button type="button" role="menuitem" onClick={() => setCurrentMenu("playlist") }>
						<EighthNote size={15} aria-hidden="true" />
						<span>Ajouter à une playlist</span>
						<ChevronRight class="right" size={17} aria-hidden="true" />
					</button>
				</div>
			</Match>
			<Match when={currentMenu() === "playlist"}>
				<div class="menu-content playlist-submenu">
					<button type="button" role="menuitem" onClick={() => setCurrentMenu("main") }>
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
					<Show when={meProfileQuery.data?.body} keyed>{(meProfile) => <For each={meProfile.ownedPlaylists.filter((p) => p.name.toLowerCase().includes(searchQuery().toLowerCase())).slice(0, 5)}>{(playlist) =>
						<button type="button" role="menuitem" onClick={() => addToPlaylist(playlist.uuid) }>
							<img src={`${env.VITE_API_URL}/playlists/${playlist.uuid}/cover`} alt="Playlist cover" />
							<span>{playlist.name}</span>
						</button>
					}</For>}</Show>
				</div>
			</Match>
		</Switch>
	</div>;
}