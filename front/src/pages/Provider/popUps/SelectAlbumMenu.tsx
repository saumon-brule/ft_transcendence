import TextInput from "~/components/inputs/TextInput";
import Form from "~/components/inputs/Form/Form";
import { createMemo, createSignal, For, Show } from "solid-js";
import Button from "~/components/inputs/Button";
import { Menu } from "~/components/ui/Menu/Menu";
import { Search } from "lucide-solid";
import { useProviderAlbumsInfiniteQuery } from "~/api/queryHooks/providerInfo";
import { Album } from "~/class/Album";
import { AlbumCover } from "~/components/ui/AlbumCard";
import { Provider } from "@flex/shared";
import "./SelectAlbumMenu.scss";
import { summonAddAlbumPopUp } from "./summonAddAlbumPopUp";
import { t } from "~/i18n/context";

export function SelectAlbumMenu(props: { provider: Provider; setAlbum: (album: Album) => void }) {
	return <Menu
		align="left"
		class="set-album-menu"
		trigger={<Button type="button">{t("pages.provider.popUps.selectAlbum")}</Button>}
	>
		{(close) => <SelectAlbumContent provider={props.provider} setAlbum={props.setAlbum} onClose={close} />}
	</Menu>;
}

function SelectAlbumContent(props: { provider: Provider; setAlbum: (album: Album) => void; onClose: () => void }) {
	const [searchQuery, setSearchQuery] = createSignal("");
	const albumsQuery = useProviderAlbumsInfiniteQuery(() => props.provider, searchQuery);
	const albums = createMemo(() => albumsQuery.data && {
		albums: albumsQuery.data.pages.flatMap((page) => page.albums),
		total: albumsQuery.data.pages[0]?.total ?? 0,
	});

	return <>
		<Form class="album-form search-form" onSubmit={(e) => {
			e.preventDefault();
		}}>
			<Search class="search-icon" size={15}/>
			<TextInput value={searchQuery()} placeholder={t("pages.provider.popUps.searchAlbum")} type="text" onInput={(e) => setSearchQuery(e.currentTarget.value)} />
		</Form>
		<Button type="button" size="sm" variant="text" class="subtext white-variant" onClick={() => summonAddAlbumPopUp(props.provider, undefined, props.setAlbum)}>{t("pages.provider.popUps.newAlbum")}</Button>
		<Show when={albums()?.albums} keyed>
			{(albums) => <For each={albums}>
				{(album) => <button class="album-menu-card" type="button" role="menuitem" onClick={() => props.setAlbum(album)}>
					<AlbumCover album={album}/>
					<span>{album.name}</span>
				</button>}
			</For>}
		</Show>
		<Show when={albumsQuery.hasNextPage}>
			<Button onClick={() => void albumsQuery.fetchNextPage()} disabled={albumsQuery.isFetchingNextPage} variant="text" class="white-variant see-more">{t("pages.search.seeMore")}</Button>
		</Show>
	</>;
}
