import { A } from "@solidjs/router";
import { createMemo, Show } from "solid-js";
import { useProviderAlbumsInfiniteQuery, useProviderArtistsInfiniteQuery, useProviderMusicsInfiniteQuery } from "~/api/queryHooks/providerInfo";
import MusicSection from "~/components/ui/MusicSection/MusicSection";
import AlbumSection from "~/components/ui/AlbumSection/AlbumSection";
import ArtistSection from "~/components/ui/ArtistSection/ArtistSection";
import NoResult from "~/components/ui/NoResult/NoResult";

const PREVIEW_SIZE = 6;

export default function ProviderTabAll(props: { providerUrl: string; providerUuid: string; search: string }) {
	const musicsQuery = useProviderMusicsInfiniteQuery(() => props.providerUrl, () => props.providerUuid, () => props.search);
	const albumsQuery = useProviderAlbumsInfiniteQuery(() => props.providerUrl, () => props.providerUuid, () => props.search);
	const artistsQuery = useProviderArtistsInfiniteQuery(() => props.providerUrl, () => props.providerUuid, () => props.search);

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
				<h2>Musics</h2>
				<MusicSection musics={musics()!.musics}/>
				<A href={seeMoreHref("Musics")} class="white-variant see-more">See more</A>
			</section>
		</Show>
		<Show when={albums()?.total}>
			<section class="albums">
				<h2>Albums</h2>
				<AlbumSection album={albums()!}/>
				<A href={seeMoreHref("Albums")} class="white-variant see-more">See more</A>
			</section>
		</Show>
		<Show when={artists()?.total}>
			<section class="artists">
				<h2>Artists</h2>
				<ArtistSection artist={artists()!}/>
				<A href={seeMoreHref("Artists")} class="white-variant see-more">See more</A>
			</section>
		</Show>
		<NoResult show={isLoaded() && total() === 0} />
	</>;
}
