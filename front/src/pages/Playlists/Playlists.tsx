import { useNavigate } from "@solidjs/router";
import { For, Show } from "solid-js";
import { usePlaylistsQuery } from "~/api/queryHooks/playlist";
import PlaylistCard, { NewPlaylistCard } from "~/components/ui/PlaylistCard/PlaylistCard";
import { summonNewPlaylistPopUp } from "./popUps/newPlaylistPopUp";
import "./Playlists.scss";
import { useTranslation } from "~/i18n/context";

export default function Playlists() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const playlists = usePlaylistsQuery();

	return <div id="playlists-page" class="page">
		<Show when={playlists.isError}>
			<p class="playlists-error">{t("pages.playlists.loadError")}</p>
		</Show>
		<Show when={playlists.data?.body} keyed>{(data) => <>
			<section>
				<h2>{t("pages.playlists.mine")}</h2>
				<div class="playlists-grid">
					<NewPlaylistCard onClick={() => summonNewPlaylistPopUp((uuid) => navigate(`/playlist/${uuid}`))} />
					<For each={data.owned}>{(playlist) => <PlaylistCard playlist={playlist} />}</For>
				</div>
			</section>
			<section>
				<h2>{t("pages.playlists.followed")}</h2>
				<Show when={data.followed.length > 0} fallback={<p class="playlists-empty">{t("pages.playlists.noFollowed")}</p>}>
					<div class="playlists-grid">
						<For each={data.followed}>{(playlist) => <PlaylistCard playlist={playlist} showOwner />}</For>
					</div>
				</Show>
			</section>
		</>}</Show>
	</div>;
}
