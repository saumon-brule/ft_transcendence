import { For, Show } from "solid-js";
import { Album } from "~/class/Album";
import { Artist } from "~/class/Artist";
import AlbumCard from "~/components/ui/AlbumCard";
import ArtistCard from "~/components/ui/ArtistCard";
import { history } from "~/store/history.store";
import "./Home.scss";
import { Music } from "~/class/Music";
import MusicCard from "~/components/ui/MusicCard";
import { useMeProfileQuery } from "~/api/queryHooks/meProfile";
import { Playlist } from "~/class/Playlist";
import PlaylistCard from "~/components/ui/PlaylistCard/PlaylistCard";

export default function Home() {
	const profile = useMeProfileQuery();
	const providers = () => profile.data?.body ? [...profile.data.body.ownedProviders, ...profile.data.body.connectedProviders] : [];

	return <div id="home" class="page">
		<Show when={history.top().length + history.last().length === 0}>
			<div>Vous n'avez encore rien écouté</div>
		</Show>
		<Show when={history.top().length}>
			<h2>Vous avez le plus écouté</h2>
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
			<h2>Vos dernieres écoutes</h2>
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
