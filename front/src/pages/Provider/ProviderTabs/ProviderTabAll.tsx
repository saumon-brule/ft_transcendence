import { A } from "@solidjs/router";
import { createMemo, Show } from "solid-js";
import { useProviderAlbumsInfiniteQuery, useProviderArtistsInfiniteQuery, useProviderMusicsInfiniteQuery } from "~/api/queryHooks/providerInfo";
import MusicSection from "~/components/ui/sections/MusicSection/MusicSection";
import AlbumSection from "~/components/ui/sections/AlbumSection/AlbumSection";
import ArtistSection from "~/components/ui/sections/ArtistSection/ArtistSection";
import NoResult from "~/components/ui/feedback/NoResult/NoResult";
import { useProvider } from "~/components/guards/ProviderInfoGuard";
import { useTranslation } from "~/i18n/context";

const PREVIEW_SIZE = 6;

export default function ProviderTabAll(props: { search: string }) {
	const { t } = useTranslation();
	const provider = useProvider();
	const musicsQuery = useProviderMusicsInfiniteQuery(() => provider, () => props.search);
	const albumsQuery = useProviderAlbumsInfiniteQuery(() => provider, () => props.search);
	const artistsQuery = useProviderArtistsInfiniteQuery(() => provider, () => props.search);

	const musics = createMemo(() => musicsQuery.data?.pages[0] && {
		musics: musicsQuery.data.pages[0].musics.slice(0, PREVIEW_SIZE),
		total: musicsQuery.data.pages[0].total,
	});
	const albums = createMemo(() => albumsQuery.data?.pages[0] && {
		albums: albumsQuery.data.pages[0].albums.slice(0, PREVIEW_SIZE),
		total: albumsQuery.data.pages[0].total,
	});
	const artists = createMemo(() => artistsQuery.data?.pages[0] && {
		artists: artistsQuery.data.pages[0].artists.slice(0, PREVIEW_SIZE),
		total: artistsQuery.data.pages[0].total,
	});

	const seeMoreHref = (tab: string) => `?tab=${tab}${props.search ? `&q=${encodeURIComponent(props.search)}` : ""}`;
	const isLoaded = () => !!(musics() && albums() && artists());
	const total = () => (musics()?.total ?? 0) + (albums()?.total ?? 0) + (artists()?.total ?? 0);

	return <>
		<Show when={musics()?.total}>
			<section class="musics">
				<h2>{t("common.tabs.Musics")}</h2>
				<MusicSection musics={musics()!.musics}/>
				<A href={seeMoreHref("Musics")} class="white-variant see-more">{t("pages.search.seeMore")}</A>
			</section>
		</Show>
		<Show when={albums()?.total}>
			<section class="albums">
				<h2>{t("common.tabs.Albums")}</h2>
				<AlbumSection album={albums()!}/>
				<A href={seeMoreHref("Albums")} class="white-variant see-more">{t("pages.search.seeMore")}</A>
			</section>
		</Show>
		<Show when={artists()?.total}>
			<section class="artists">
				<h2>{t("common.tabs.Artists")}</h2>
				<ArtistSection artist={artists()!}/>
				<A href={seeMoreHref("Artists")} class="white-variant see-more">{t("pages.search.seeMore")}</A>
			</section>
		</Show>
		<NoResult show={isLoaded() && total() === 0} />
	</>;
}
