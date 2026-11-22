import { playlistCoverUrl } from "~/utils/playlistCover";
import { For, Show } from "solid-js";
import { A } from "@solidjs/router";
import type { User } from "@flex/shared";
import { useTranslation } from "~/i18n/context";

type PlaylistSectionProps = { playlists: User["ownedPlaylists"] };

export default function PlaylistSection(props: PlaylistSectionProps) {
	const { t } = useTranslation();
	return <Show when={props.playlists.length > 0}>
		<section class="playlists">
			<h3>{t("pages.profile.playlists")}</h3>
			<div class="playlists-list">
				<For each={props.playlists}>{(playlist) => <A class="playlist-card" href={`/playlist/${playlist.uuid}`}>
					<img src={playlistCoverUrl(playlist.uuid)} alt={t("common.playlistCover")} />
					<div class="playlist-info">
						<h4>{playlist.name}</h4>
						<p>{t("components.playlistCard.musicCount", { count: String(playlist._count.musics) })}</p>
					</div>
				</A>}</For>
			</div>
		</section>
	</Show>;
}
