import { For, Show } from "solid-js";
import { Album } from "~/class/Album";
import { Artist } from "~/class/Artist";
import AlbumCard from "~/components/ui/AlbumCard";
import ArtistCard from "~/components/ui/ArtistCard";
import { history } from "~/store/history.store";
import "./Home.scss";
import { Music } from "~/class/Music";
import MusicCard from "~/components/ui/MusicCard";
import { useProfile } from "~/components/guards/ProfileGate";
import { Playlist } from "~/class/Playlist";
import PlaylistCard from "~/components/ui/PlaylistCard/PlaylistCard";
import { useTranslation } from "~/i18n/context";

export default function Home() {
	const { t } = useTranslation();
	const me = useProfile();
	const providers = () => [...me().ownedProviders, ...me().connectedProviders];

	return <div id="home" class="page">
		<Show when={history.top().length + history.last().length === 0}>
			<div>{t("pages.home.empty")}</div>
		</Show>
		<Show when={history.top().length}>
			<h2>{t("pages.home.mostListened")}</h2>
			<div class="card-list">
				<For each={history.top()}>{(e) => {
					if (e instanceof Artist) return <ArtistCard artist={e} providers={providers()}/>;
					else if (e instanceof Album) return <AlbumCard album={e} providers={providers()} hiddenProp={["published"]}/>;
					else if (e instanceof Music) return <MusicCard music={e} providers={providers()}/>;
					else if (e instanceof Playlist) return <PlaylistCard playlist={e} showOwner/>;
				}}</For>
			</div>
		</Show>
		<Show when={history.last().length}>
			<h2>{t("pages.home.recentlyListened")}</h2>
			<div class="card-list">
				<For each={history.last()}>{(e) => {
					if (e instanceof Artist) return <ArtistCard artist={e} providers={providers()}/>;
					else if (e instanceof Album) return <AlbumCard album={e} providers={providers()} hiddenProp={["published"]}/>;
					else if (e instanceof Music) return <MusicCard music={e} providers={providers()}/>;
					else if (e instanceof Playlist) return <PlaylistCard playlist={e} showOwner/>;
				}}</For>
			</div>
		</Show>
	</div>;
}
