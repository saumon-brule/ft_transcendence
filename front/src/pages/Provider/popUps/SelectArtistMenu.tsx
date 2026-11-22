import TextInput from "~/components/inputs/TextInput";
import Form from "~/components/inputs/Form/Form";
import { createMemo, createSignal, For, Show } from "solid-js";
import Button from "~/components/inputs/Button";
import { Menu } from "~/components/ui/overlays/Menu/Menu";
import { Plus, Search } from "lucide-solid";
import { useProviderArtistsInfiniteQuery } from "~/api/queryHooks/providerInfo";
import { Artist } from "~/class/Artist";
import { ArtistAvatar } from "~/components/ui/cards/ArtistCard";
import { Provider } from "@flex/shared";
import { summonAddArtistPopUp } from "./summonAddArtistPopUp";
import "./SelectArtistMenu.scss";
import { t } from "~/i18n/context";

export function SelectArtistMenu(props: { provider: Provider; exclude?: Artist[]; addArtist: (artist: Artist) => void }) {
	return <Menu
		align="left"
		class="set-artist-menu"
		trigger={<Button class="add-artist" type="button" variant="text" icon><Plus size={40}/></Button>}
	>
		{(close) => <SelectArtistContent provider={props.provider} exclude={props.exclude} addArtist={props.addArtist} onClose={close} />}
	</Menu>;
}

function SelectArtistContent(props: { provider: Provider; addArtist: (artist: Artist) => void; exclude?: Artist[]; onClose: () => void }) {
	const [searchQuery, setSearchQuery] = createSignal("");
	const artistsQuery = useProviderArtistsInfiniteQuery(() => props.provider, searchQuery);
	const artists = createMemo(() => artistsQuery.data && {
		artists: artistsQuery.data.pages.flatMap((page) => page.artists).filter((a) => !props.exclude?.map((am) => am.uuid).includes(a.uuid)),
		total: artistsQuery.data.pages[0]?.total ?? 0,
	});

	return <>
		<Form class="artist-form search-form" onSubmit={(e) => {
			e.preventDefault();
		}}>
			<Search class="search-icon" size={15}/>
			<TextInput value={searchQuery()} placeholder={t("pages.provider.popUps.searchArtist")} type="text" onInput={(e) => setSearchQuery(e.currentTarget.value)} />
		</Form>
		<Button type="button" size="sm" variant="text" class="subtext white-variant" onClick={() => summonAddArtistPopUp(props.provider, "", props.addArtist)}>{t("pages.provider.popUps.newArtist")}</Button>
		<Show when={artists()?.artists} keyed>
			{(artists) => <For each={artists}>
				{(artist) => <button class="artist-menu-card" type="button" role="menuitem" onClick={() => props.addArtist(artist)}>
					<ArtistAvatar artist={artist}/>
					<span>{artist.name}</span>
				</button>}
			</For>}
		</Show>
		<Show when={artistsQuery.hasNextPage}>
			<Button type="button" onClick={() => void artistsQuery.fetchNextPage()} disabled={artistsQuery.isFetchingNextPage} variant="text" class="white-variant see-more">{t("pages.search.seeMore")}</Button>
		</Show>
	</>;
}
