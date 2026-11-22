import { Show } from "solid-js";
import { A, useNavigate } from "@solidjs/router";
import type { PlaylistDetailDto } from "@flex/shared";
import { playlistCoverUrl } from "~/utils/playlistCover";
import { Music } from "~/class/Music";
import { MusicGroup } from "~/store/trackManager.store";
import { useAudioManagerContext } from "~/components/context/AudioManagerContext";
import Button from "~/components/inputs/Button";
import { Globe, Lock, Pencil, Play, Shuffle, Trash2 } from "lucide-solid";
import { useSetPlaylistPrivacyMutation } from "~/api/queryHooks/playlist";
import { summonRenamePlaylistPopUp } from "./popUps/renamePlaylistPopUp";
import { summonDeletePlaylistPopUp } from "./popUps/deletePlaylistPopUp";
import { summonChangeCoverPopUp } from "./popUps/changeCoverPopUp";
import { Playlist } from "~/class/Playlist";
import { history } from "~/store/history.store";
import { useTranslation } from "~/i18n/context";

type PlaylistHeaderProps = {
	playlist: PlaylistDetailDto;
	musicGroup: MusicGroup;
};

function formatTotalDuration(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	return hours > 0
		? `${hours} h ${minutes} min`
		: `${minutes} min`;
}

export default function PlaylistHeader(props: PlaylistHeaderProps) {
	const { t } = useTranslation();
	const audioManager = useAudioManagerContext();
	const navigate = useNavigate();
	const setPrivacy = useSetPlaylistPrivacyMutation();

	const musics = () => props.musicGroup.musics.filter((music): music is Music => music instanceof Music);
	const loading = () => props.musicGroup.musics.some((music) => music.isLoading());
	const unavailable = () => props.musicGroup.musics.length - musics().length;
	const totalDuration = () => musics().reduce((total, music) => total + music.duration, 0);

	function playMusicGroup(musicGroup: MusicGroup, shuffle: boolean = false) {
		audioManager.setMusicGroup(musicGroup);
		if (shuffle) audioManager.shuffle();
		audioManager.position = 0;
		audioManager.play();
		history.playlist.listen(Playlist.fromDetail(props.playlist));
	}

	function togglePrivacy() {
		setPrivacy.mutate({ params: { uuid: props.playlist.uuid }, body: { private: !props.playlist.private } });
	}

	return <header class="playlist-header">
		<Show when={props.playlist.isOwner} fallback={<img src={playlistCoverUrl(props.playlist.uuid)} alt={t("common.playlistCover")} />}>
			<button type="button" class="cover-button" aria-label={t("pages.playlist.changeCover")} onClick={() => summonChangeCoverPopUp(props.playlist)}>
				<img src={playlistCoverUrl(props.playlist.uuid)} alt={t("common.playlistCover")} />
				<span class="cover-overlay"><Pencil /></span>
			</button>
		</Show>
		<div class="header-container">
			<div class="header-info">
				<span class="badge">
					<Show when={props.playlist.private} fallback={<><Globe size={12} /> {t("common.public")}</>}><Lock size={12} /> {t("common.private")}</Show>
				</span>
				<h2>{props.playlist.name}</h2>
				<div class="stats">
					<span class="stat">{t("components.playlistCard.musicCount", { count: String(props.playlist.musics.length) })}</span>
					<Show when={!loading() && musics().length > 0}>
						<div class="separator" />
						<span class="stat">{formatTotalDuration(totalDuration())}</span>
					</Show>
					<Show when={!loading() && unavailable() > 0}>
						<div class="separator" />
						<span class="stat">{t("pages.playlist.unavailableCount", { count: String(unavailable()) })}</span>
					</Show>
				</div>
				<p>{t("pages.playlist.by")} <A href={`/user/${props.playlist.owner.uuid}`}>{props.playlist.owner.username}</A></p>
			</div>
			<div class="header-controls">
				<Show when={props.musicGroup} fallback={<><Button icon disabled><Play /></Button><Button icon disabled><Shuffle /></Button></>}>
					{(musicGroup) => <>
						<Button icon disabled={musicGroup().musics.length === 0} onClick={() => playMusicGroup(musicGroup())}><Play /></Button>
						<Button icon disabled={musicGroup().musics.length === 0} onClick={() => playMusicGroup(musicGroup(), true)}><Shuffle /></Button>
					</>}
				</Show>
			</div>
		</div>
		<div class="header-actions">
			<Show when={props.playlist.isOwner}>
				<Button variant="text" onClick={() => summonRenamePlaylistPopUp(props.playlist)}><Pencil /> {t("pages.playlist.rename")}</Button>
				<Button variant="text" disabled={setPrivacy.isPending} onClick={togglePrivacy}>
					<span class="toggle-labels">
						<span classList={{ inactive: !props.playlist.private }}><Globe /> {t("pages.playlist.makePublic")}</span>
						<span classList={{ inactive: props.playlist.private }}><Lock /> {t("pages.playlist.makePrivate")}</span>
					</span>
				</Button>
				<Button variant="danger" onClick={() => summonDeletePlaylistPopUp(props.playlist, () => navigate("/playlists"))}><Trash2 /> {t("common.delete")}</Button>
			</Show>
		</div>
	</header>;
}
